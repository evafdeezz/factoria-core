package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.AthleteProfile;
import com.factoriacore.backend.models.MenstrualCycle;
import com.factoriacore.backend.models.User;
import com.factoriacore.backend.models.enums.Gender;
import com.factoriacore.backend.models.enums.UserRole;
import com.factoriacore.backend.repositories.AthleteProfileRepository;
import com.factoriacore.backend.repositories.MenstrualCycleRepository;
import com.factoriacore.backend.repositories.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final LocalDate MIN_BIRTH_DATE = LocalDate.of(1900, 1, 1);
    private static final LocalDate MIN_PERIOD_DATE = LocalDate.of(2024, 1, 1);

    @Value("${app.backend-url}")
    private String backendUrl;

    private final UserRepository userRepository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final MenstrualCycleRepository menstrualCycleRepository;

    public AuthController(UserRepository userRepository,
                          AthleteProfileRepository athleteProfileRepository,
                          MenstrualCycleRepository menstrualCycleRepository) {
        this.userRepository = userRepository;
        this.athleteProfileRepository = athleteProfileRepository;
        this.menstrualCycleRepository = menstrualCycleRepository;
    }

    public static class CurrentUserDto {
        private Long id;
        private String fullName;
        private String email;
        private String role;
        private String pictureUrl;
        private Long athleteProfileId;

        public CurrentUserDto(Long id, String fullName, String email,
                              String role, String pictureUrl, Long athleteProfileId) {
            this.id = id;
            this.fullName = fullName;
            this.email = email;
            this.role = role;
            this.pictureUrl = pictureUrl;
            this.athleteProfileId = athleteProfileId;
        }

        public Long getId() { return id; }
    }

    public static class PendingOAuthUserDto {
        private String fullName;
        private String email;
        private String pictureUrl;

        public PendingOAuthUserDto(String fullName, String email, String pictureUrl) {
            this.fullName = fullName;
            this.email = email;
            this.pictureUrl = pictureUrl;
        }
        public String getFullName() { return fullName; }
        public String getEmail() { return email; }
        public String getPictureUrl() { return pictureUrl; }
    }

    public static class CompleteOAuthRegisterRequest {
        private String role;
        private String fullName;
        private String birthDate;
        private String sex;
        private Boolean menstrualTrackingEnabled;
        private Boolean shareMenstrualDataWithCoach;
        private Integer cycleLength;
        private Integer menstrualDuration;
        private String lastPeriodDate;

        public String getRole() { return role; }

        public String getFullName() { return fullName; }

        public String getBirthDate() { return birthDate; }

        public String getSex() { return sex; }

        public Boolean getMenstrualTrackingEnabled() { return menstrualTrackingEnabled; }

        public Boolean getShareMenstrualDataWithCoach() { return shareMenstrualDataWithCoach; }

        public Integer getCycleLength() { return cycleLength; }

        public Integer getMenstrualDuration() { return menstrualDuration; }

        public String getLastPeriodDate() { return lastPeriodDate; }
    }

    @GetMapping("/oauth/login")
    public void startGoogleLogin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(true);
        clearOAuthSession(session);
        session.setAttribute("OAUTH_MODE", "login");
        response.sendRedirect(backendUrl + "/oauth2/authorization/google");
    }

    @GetMapping("/oauth/register/start")
    public void startGoogleRegister(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(true);
        clearOAuthSession(session);
        session.setAttribute("OAUTH_MODE", "register");
        response.sendRedirect(backendUrl + "/oauth2/authorization/google");
    }

    @GetMapping("/oauth/pending")
    public ResponseEntity<?> getPendingOAuthUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("NO_PENDING_OAUTH");
        }

        String email = (String) session.getAttribute("OAUTH_PENDING_EMAIL");
        String fullName = (String) session.getAttribute("OAUTH_PENDING_FULL_NAME");
        String pictureUrl = (String) session.getAttribute("OAUTH_PENDING_PICTURE_URL");

        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("NO_PENDING_OAUTH");
        }

        return ResponseEntity.ok(new PendingOAuthUserDto(
                fullName != null ? fullName : "",
                email,
                pictureUrl != null ? pictureUrl : ""
        ));
    }

    @PostMapping("/oauth/register")
    public ResponseEntity<?> completeOAuthRegister(@RequestBody CompleteOAuthRegisterRequest body,
                                                   HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("NO_PENDING_OAUTH");
        }

        String email = (String) session.getAttribute("OAUTH_PENDING_EMAIL");
        String givenName = (String) session.getAttribute("OAUTH_PENDING_GIVEN_NAME");
        String familyName = (String) session.getAttribute("OAUTH_PENDING_FAMILY_NAME");
        String provider = (String) session.getAttribute("OAUTH_PENDING_PROVIDER");
        String providerUserId = (String) session.getAttribute("OAUTH_PENDING_PROVIDER_USER_ID");
        String pictureUrl = (String) session.getAttribute("OAUTH_PENDING_PICTURE_URL");

        if (email == null || providerUserId == null || provider == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("NO_PENDING_OAUTH");
        }

        UserRole role;
        try {
            role = UserRole.valueOf(body.getRole());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("INVALID_ROLE");
        }

        Gender sex;
        try {
            sex = Gender.valueOf(body.getSex());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("INVALID_SEX");
        }

        LocalDate parsedBirthDate = parseAndValidateBirthDate(body.getBirthDate());
        LocalDate parsedLastPeriodDate = parseAndValidatePeriodDate(body.getLastPeriodDate());

        boolean menstrualTrackingEnabled =
                role == UserRole.ATHLETE
                        && sex == Gender.FEMALE
                        && Boolean.TRUE.equals(body.getMenstrualTrackingEnabled());

        if (menstrualTrackingEnabled) {
            validateMenstrualRegisterData(body, parsedLastPeriodDate);
        }

        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            clearOAuthSession(session);
            return ResponseEntity.status(HttpStatus.CONFLICT).body("EMAIL_ALREADY_EXISTS");
        }

        String displayName = (body.getFullName() != null && !body.getFullName().isBlank())
                ? body.getFullName()
                : (givenName != null ? givenName : email);

        User user = new User();
        user.setEmail(email);
        user.setFullName(displayName);
        user.setGivenName(givenName);
        user.setFamilyName(familyName);
        user.setGoogleId(providerUserId);
        user.setPictureUrl(pictureUrl);
        user.setRole(role);
        user.setActive(true);
        user.setCreatedAt(OffsetDateTime.now());
        user.setUpdatedAt(OffsetDateTime.now());

        if (parsedBirthDate != null) {
            user.setBirthDate(parsedBirthDate);
        }

        User saved = userRepository.save(user);

        Long athleteProfileId = null;

        if (role == UserRole.ATHLETE) {
            AthleteProfile profile = new AthleteProfile();
            profile.setUser(saved);
            profile.setSex(sex);

            if (parsedBirthDate != null) {
                profile.setBirthDate(parsedBirthDate);
            }

            if (menstrualTrackingEnabled) {
                profile.setMenstrualTrackingEnabled(true);
                profile.setShareMenstrualDataWithCoach(
                        Boolean.TRUE.equals(body.getShareMenstrualDataWithCoach())
                );
                profile.setCycleLength(body.getCycleLength());
                profile.setMenstrualDuration(body.getMenstrualDuration());
                profile.setLastPeriodDate(parsedLastPeriodDate);
            } else {
                profile.setMenstrualTrackingEnabled(false);
                profile.setShareMenstrualDataWithCoach(false);
            }

            AthleteProfile savedProfile = athleteProfileRepository.save(profile);
            createInitialMenstrualCycleIfNeeded(savedProfile);

            athleteProfileId = savedProfile.getId();
        }

        clearOAuthSession(session);

        return ResponseEntity.status(HttpStatus.CREATED).body(new CurrentUserDto(
                saved.getId(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getRole().name(),
                saved.getPictureUrl(),
                athleteProfileId
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof OAuth2User oauthUser)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("NOT_AUTHENTICATED");
        }

        String email = oauthUser.getAttribute("email");
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("EMAIL_NOT_AVAILABLE");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("USER_NOT_FOUND");
        }

        User user = userOpt.get();
        Long athleteProfileId = athleteProfileRepository.findByUserId(user.getId())
                .map(AthleteProfile::getId)
                .orElse(null);

        return ResponseEntity.ok(new CurrentUserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getPictureUrl(),
                athleteProfileId
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        try {
            request.logout();
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            return ResponseEntity.ok("LOGOUT_OK");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("LOGOUT_ERROR");
        }
    }

    private LocalDate parseAndValidateBirthDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        LocalDate date = LocalDate.parse(value);
        LocalDate today = LocalDate.now();

        if (date.isBefore(MIN_BIRTH_DATE) || date.isAfter(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_BIRTH_DATE");
        }

        return date;
    }

    private LocalDate parseAndValidatePeriodDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        LocalDate date = LocalDate.parse(value);
        LocalDate today = LocalDate.now();

        if (date.isBefore(MIN_PERIOD_DATE) || date.isAfter(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_LAST_PERIOD_DATE");
        }

        return date;
    }

    private void validateMenstrualRegisterData(CompleteOAuthRegisterRequest body,
                                               LocalDate parsedLastPeriodDate) {
        if (body.getCycleLength() == null ||
                body.getCycleLength() < 20 ||
                body.getCycleLength() > 45) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_CYCLE_LENGTH");
        }

        if (body.getMenstrualDuration() == null ||
                body.getMenstrualDuration() < 2 ||
                body.getMenstrualDuration() > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_MENSTRUAL_DURATION");
        }

        if (parsedLastPeriodDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "LAST_PERIOD_DATE_REQUIRED");
        }
    }

    private void createInitialMenstrualCycleIfNeeded(AthleteProfile profile) {
        if (!profile.isMenstrualTrackingEnabled() || profile.getLastPeriodDate() == null) {
            return;
        }

        MenstrualCycle cycle = menstrualCycleRepository
                .findByAthlete_IdAndStartDate(profile.getId(), profile.getLastPeriodDate())
                .orElseGet(() -> {
                    MenstrualCycle newCycle = new MenstrualCycle();
                    newCycle.setAthlete(profile);
                    newCycle.setStartDate(profile.getLastPeriodDate());
                    return newCycle;
                });

        cycle.setCycleLength(profile.getCycleLength());
        cycle.setBleedingDays(profile.getMenstrualDuration());

        menstrualCycleRepository.save(cycle);
    }

    private void clearOAuthSession(HttpSession session) {
        session.removeAttribute("OAUTH_MODE");
        session.removeAttribute("OAUTH_PENDING_EMAIL");
        session.removeAttribute("OAUTH_PENDING_FULL_NAME");
        session.removeAttribute("OAUTH_PENDING_GIVEN_NAME");
        session.removeAttribute("OAUTH_PENDING_FAMILY_NAME");
        session.removeAttribute("OAUTH_PENDING_PROVIDER");
        session.removeAttribute("OAUTH_PENDING_PROVIDER_USER_ID");
        session.removeAttribute("OAUTH_PENDING_PICTURE_URL");
    }
}