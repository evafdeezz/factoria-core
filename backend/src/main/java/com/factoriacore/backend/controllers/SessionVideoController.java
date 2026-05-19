package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.AthleteProfile;
import com.factoriacore.backend.models.SessionVideo;
import com.factoriacore.backend.models.TrainingSession;
import com.factoriacore.backend.repositories.AthleteProfileRepository;
import com.factoriacore.backend.repositories.SessionVideoRepository;
import com.factoriacore.backend.repositories.TrainingSessionRepository;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/videos")
public class SessionVideoController {

    private final SessionVideoRepository repository;
    private final TrainingSessionRepository sessionRepository;
    private final AthleteProfileRepository athleteRepository;

    public SessionVideoController(SessionVideoRepository repository,
                                  TrainingSessionRepository sessionRepository,
                                  AthleteProfileRepository athleteRepository) {
        this.repository = repository;
        this.sessionRepository = sessionRepository;
        this.athleteRepository = athleteRepository;
    }

    @GetMapping("/session/{sessionId}")
    public List<SessionVideo> getBySession(@PathVariable Long sessionId) {
        return repository.findBySession_Id(sessionId);
    }

    @GetMapping("/athlete/{athleteId}")
    public List<SessionVideo> getByAthlete(@PathVariable Long athleteId) {
        return repository.findByAthlete_Id(athleteId);
    }

    @GetMapping("/session/{sessionId}/athlete/{athleteId}")
    public List<SessionVideo> getBySessionAndAthlete(@PathVariable Long sessionId,
                                                     @PathVariable Long athleteId) {
        return repository.findBySession_IdAndAthlete_Id(sessionId, athleteId);
    }

    @PostMapping
    public SessionVideo create(@RequestBody VideoRequest request) {
        TrainingSession session = sessionRepository.findById(request.sessionId)
                .orElseThrow(() -> new RuntimeException("Sesión no encontrada"));
        AthleteProfile athlete = athleteRepository.findById(request.athleteId)
                .orElseThrow(() -> new RuntimeException("Atleta no encontrado"));

        SessionVideo video = new SessionVideo();
        video.setSession(session);
        video.setAthlete(athlete);
        video.setUrl(request.url);
        video.setType(request.type);
        video.setNotes(request.notes);
        video.setCreatedAt(OffsetDateTime.now());
        return repository.save(video);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }

    // DTO interno para recibir el POST
    public static class VideoRequest {
        public Long sessionId;
        public Long athleteId;
        public String url;
        public String type;
        public String notes;
    }
}