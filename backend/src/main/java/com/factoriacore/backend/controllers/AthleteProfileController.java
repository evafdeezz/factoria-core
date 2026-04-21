package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.AthleteProfile;
import com.factoriacore.backend.models.User;
import com.factoriacore.backend.repositories.AthleteProfileRepository;
import com.factoriacore.backend.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/athletes")
public class AthleteProfileController {

    private final AthleteProfileRepository profileRepo;
    private final UserRepository userRepo;

    public AthleteProfileController(AthleteProfileRepository profileRepo,
                                    UserRepository userRepo) {
        this.profileRepo = profileRepo;
        this.userRepo = userRepo;
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

        AthleteProfile profile = profileRepo.findByUserId(userId)
                .orElseGet(() -> {
                    AthleteProfile p = new AthleteProfile();
                    User u = userRepo.findById(userId)
                            .orElseThrow(() ->
                                    new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
                    p.setUser(u);
                    return p;
                });

        if (incoming.getBirthDate() != null)          profile.setBirthDate(incoming.getBirthDate());
        if (incoming.getSex() != null)                profile.setSex(incoming.getSex());
        if (incoming.getDiscipline() != null)         profile.setDiscipline(incoming.getDiscipline());
        if (incoming.getDistanceProfile() != null)    profile.setDistanceProfile(incoming.getDistanceProfile());
        if (incoming.getTrainingSlot() != null)       profile.setTrainingSlot(incoming.getTrainingSlot());
        if (incoming.getCompetitionCategory() != null) profile.setCompetitionCategory(incoming.getCompetitionCategory());
        if (incoming.getPrimaryEvent() != null)       profile.setPrimaryEvent(incoming.getPrimaryEvent());
        if (incoming.getAvatarUrl() != null)          profile.setAvatarUrl(incoming.getAvatarUrl());
        if (incoming.getNotes() != null)              profile.setNotes(incoming.getNotes());

        // Menstruacion
        profile.setMenstrualTrackingEnabled(incoming.isMenstrualTrackingEnabled());
        profile.setShareMenstrualDataWithCoach(incoming.isShareMenstrualDataWithCoach());
        if (incoming.getCycleLength() != null)       profile.setCycleLength(incoming.getCycleLength());
        if (incoming.getMenstrualDuration() != null) profile.setMenstrualDuration(incoming.getMenstrualDuration());
        if (incoming.getLastPeriodDate() != null)    profile.setLastPeriodDate(incoming.getLastPeriodDate());

        profile.setActive(incoming.isActive());

        return profileRepo.save(profile);
    }
}