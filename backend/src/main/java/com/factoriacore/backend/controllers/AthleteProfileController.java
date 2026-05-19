package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.AthleteProfile;
import com.factoriacore.backend.models.MenstrualCycle;
import com.factoriacore.backend.models.User;
import com.factoriacore.backend.repositories.AthleteProfileRepository;
import com.factoriacore.backend.repositories.MenstrualCycleRepository;
import com.factoriacore.backend.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/athletes")
public class AthleteProfileController {

    private static final LocalDate MIN_BIRTH_DATE = LocalDate.of(1900, 1, 1);
    private static final LocalDate MIN_PERIOD_DATE = LocalDate.of(2024, 1, 1);

    private final AthleteProfileRepository profileRepo;
    private final UserRepository userRepo;
    private final MenstrualCycleRepository menstrualCycleRepository;

    public AthleteProfileController(AthleteProfileRepository profileRepo,
                                    UserRepository userRepo,
                                    MenstrualCycleRepository menstrualCycleRepository) {
        this.profileRepo = profileRepo;
        this.userRepo = userRepo;
        this.menstrualCycleRepository = menstrualCycleRepository;
    }

    @GetMapping("/{userId}/profile")
    public AthleteProfile getProfile(@PathVariable Long userId) {
        return profileRepo.findByUserId(userId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND"));
    }

    @PutMapping("/{userId}/profile")
    public AthleteProfile updateProfile(@PathVariable Long userId,
                                        @RequestBody AthleteProfile incoming) {

        validateBirthDate(incoming.getBirthDate());

        AthleteProfile profile = profileRepo.findByUserId(userId)
                .orElseGet(() -> {
                    AthleteProfile p = new AthleteProfile();
                    User u = userRepo.findById(userId)
                            .orElseThrow(() ->
                                    new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
                    p.setUser(u);
                    return p;
                });

        if (incoming.getBirthDate() != null) {
            profile.setBirthDate(incoming.getBirthDate());
        }

        if (incoming.getSex() != null) {
            profile.setSex(incoming.getSex());
        }

        if (incoming.getDiscipline() != null) {
            profile.setDiscipline(incoming.getDiscipline());
        }

        if (incoming.getDistanceProfile() != null) {
            profile.setDistanceProfile(incoming.getDistanceProfile());
        }

        profile.setMenstrualTrackingEnabled(incoming.isMenstrualTrackingEnabled());

        if (!incoming.isMenstrualTrackingEnabled()) {
            profile.setShareMenstrualDataWithCoach(false);
            profile.setCycleLength(null);
            profile.setMenstrualDuration(null);
            profile.setLastPeriodDate(null);

            return profileRepo.save(profile);
        }

        validateMenstrualData(incoming);

        profile.setShareMenstrualDataWithCoach(incoming.isShareMenstrualDataWithCoach());

        if (incoming.getCycleLength() != null) {
            profile.setCycleLength(incoming.getCycleLength());
        }

        if (incoming.getMenstrualDuration() != null) {
            profile.setMenstrualDuration(incoming.getMenstrualDuration());
        }

        if (incoming.getLastPeriodDate() != null) {
            profile.setLastPeriodDate(incoming.getLastPeriodDate());
        }

        AthleteProfile saved = profileRepo.save(profile);

        syncLastPeriodDateWithMenstrualCycle(saved);

        return saved;
    }

    private void validateBirthDate(LocalDate birthDate) {
        if (birthDate == null) {
            return;
        }

        LocalDate today = LocalDate.now();

        if (birthDate.isBefore(MIN_BIRTH_DATE) || birthDate.isAfter(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_BIRTH_DATE");
        }
    }

    private void validateMenstrualData(AthleteProfile incoming) {
        if (incoming.getCycleLength() == null ||
                incoming.getCycleLength() < 20 ||
                incoming.getCycleLength() > 45) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_CYCLE_LENGTH");
        }

        if (incoming.getMenstrualDuration() == null ||
                incoming.getMenstrualDuration() < 2 ||
                incoming.getMenstrualDuration() > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_MENSTRUAL_DURATION");
        }

        if (incoming.getLastPeriodDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "LAST_PERIOD_DATE_REQUIRED");
        }

        LocalDate today = LocalDate.now();

        if (incoming.getLastPeriodDate().isBefore(MIN_PERIOD_DATE) ||
                incoming.getLastPeriodDate().isAfter(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_LAST_PERIOD_DATE");
        }
    }

    private void syncLastPeriodDateWithMenstrualCycle(AthleteProfile profile) {
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
}