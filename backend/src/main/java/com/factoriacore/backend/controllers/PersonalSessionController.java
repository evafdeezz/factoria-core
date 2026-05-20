package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.AthleteProfile;
import com.factoriacore.backend.models.PersonalSession;
import com.factoriacore.backend.models.User;
import com.factoriacore.backend.models.enums.PersonalSessionType;
import com.factoriacore.backend.models.enums.UserRole;
import com.factoriacore.backend.repositories.AthleteProfileRepository;
import com.factoriacore.backend.repositories.GroupMemberRepository;
import com.factoriacore.backend.repositories.PersonalSessionRepository;
import com.factoriacore.backend.repositories.UserRepository;
import com.factoriacore.backend.security.AppUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/personal-sessions")
public class PersonalSessionController {

    private final PersonalSessionRepository repository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    public PersonalSessionController(PersonalSessionRepository repository,
                                     AthleteProfileRepository athleteProfileRepository,
                                     GroupMemberRepository groupMemberRepository,
                                     UserRepository userRepository) {
        this.repository = repository;
        this.athleteProfileRepository = athleteProfileRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Object principal = authentication.getPrincipal();
        if (principal instanceof AppUserDetails a) return a.getUser();
        if (principal instanceof OAuth2User o) {
            String email = o.getAttribute("email");
            if (email == null) email = o.getName();
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
    }

    // Atleta — ver sus propias sesiones
    @GetMapping("/athlete/{athleteId}")
    public List<PersonalSession> getByAthlete(@PathVariable Long athleteId,
                                              Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        AthleteProfile profile = athleteProfileRepository.findById(athleteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        boolean isOwner = profile.getUser().getId().equals(currentUser.getId());
        boolean isCoach = currentUser.getRole() == UserRole.COACH
                && groupMemberRepository.existsByAthlete_IdAndGroup_CoachId(athleteId, currentUser.getId());

        if (!isOwner && !isCoach) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        return repository.findByAthlete_IdOrderByDateDesc(athleteId);
    }

    // Atleta — crear sesión personal
    @PostMapping
    public ResponseEntity<PersonalSession> create(@RequestBody PersonalSessionRequest request,
                                                  Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        AthleteProfile profile = athleteProfileRepository.findById(request.athleteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!profile.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        PersonalSession session = new PersonalSession();
        session.setAthlete(profile);
        session.setDate(LocalDate.parse(request.date));
        session.setTitle(request.title);
        session.setType(PersonalSessionType.valueOf(request.type));
        session.setNotes(request.notes);

        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(session));
    }

    // Atleta — eliminar sesión personal
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        PersonalSession session = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!session.getAthlete().getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // DTO de entrada
    public static class PersonalSessionRequest {
        public Long athleteId;
        public String date;
        public String title;
        public String type;
        public String notes;
    }
}