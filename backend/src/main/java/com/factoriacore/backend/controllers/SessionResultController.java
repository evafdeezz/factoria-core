package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.AthleteProfile;
import com.factoriacore.backend.models.SessionResult;
import com.factoriacore.backend.models.TrainingSession;
import com.factoriacore.backend.repositories.AthleteProfileRepository;
import com.factoriacore.backend.repositories.SessionResultRepository;
import com.factoriacore.backend.repositories.TrainingSessionRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/results")
public class SessionResultController {

    private final SessionResultRepository repository;
    private final TrainingSessionRepository trainingSessionRepository;
    private final AthleteProfileRepository athleteProfileRepository;

    public SessionResultController(SessionResultRepository repository,
                                   TrainingSessionRepository trainingSessionRepository,
                                   AthleteProfileRepository athleteProfileRepository) {
        this.repository = repository;
        this.trainingSessionRepository = trainingSessionRepository;
        this.athleteProfileRepository = athleteProfileRepository;
    }

    @GetMapping
    public List<SessionResult> getAll() {
        return repository.findAll();
    }

    @GetMapping("/session/{sessionId}")
    public List<SessionResult> getBySession(@PathVariable Long sessionId) {
        return repository.findBySession_IdOrderByRecordedAtDesc(sessionId);
    }

    @GetMapping("/athlete/{athleteId}")
    public List<SessionResult> getByAthlete(@PathVariable Long athleteId) {
        return repository.findByAthlete_IdOrderByRecordedAtDesc(athleteId);
    }

    @PostMapping
    public SessionResult createOrUpdate(@RequestBody SessionResult request) {
        if (request.getSession() == null || request.getSession().getId() == null) {
            throw new IllegalArgumentException("session.id es obligatorio");
        }
        if (request.getAthlete() == null || request.getAthlete().getId() == null) {
            throw new IllegalArgumentException("athlete.id es obligatorio");
        }

        TrainingSession session = trainingSessionRepository.findById(request.getSession().getId())
                .orElseThrow(() -> new RuntimeException("TrainingSession not found"));
        AthleteProfile athlete = athleteProfileRepository.findById(request.getAthlete().getId())
                .orElseThrow(() -> new RuntimeException("Athlete not found"));

        Optional<SessionResult> existingOpt = repository.findBySessionAndAthlete(session, athlete);
        SessionResult toSave = existingOpt.orElseGet(SessionResult::new);
        toSave.setSession(session);
        toSave.setAthlete(athlete);
        toSave.setTimeMain(request.getTimeMain());
        toSave.setRpe(request.getRpe());
        toSave.setComment(request.getComment());
        toSave.setPainFlag(request.isPainFlag());
        toSave.setPainNotes(request.getPainNotes());
        toSave.setVideoUrl(request.getVideoUrl());

        return repository.save(toSave);
    }
}