package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.SessionVideo;
import com.factoriacore.backend.repositories.SessionVideoRepository;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/videos")
public class SessionVideoController
{
    private final SessionVideoRepository repository;

    public SessionVideoController(SessionVideoRepository repository) {
        this.repository = repository;
    }

    // 1) Todos los vídeos (debug / administración)
    @GetMapping
    public List<SessionVideo> getAll() {
        return repository.findAll();
    }

    // 2) Vídeos de una sesión
    @GetMapping("/session/{sessionId}")
    public List<SessionVideo> getBySession(@PathVariable Long sessionId) {
        return repository.findBySessionId(sessionId);
    }

    // 3) Vídeos de un atleta
    @GetMapping("/athlete/{athleteId}")
    public List<SessionVideo> getByAthlete(@PathVariable Long athleteId) {
        return repository.findByAthleteId(athleteId);
    }

    // 4) Vídeos de un atleta en una sesión
    @GetMapping("/session/{sessionId}/athlete/{athleteId}")
    public List<SessionVideo> getBySessionAndAthlete(@PathVariable Long sessionId,
                                                     @PathVariable Long athleteId) {
        return repository.findBySessionIdAndAthleteId(sessionId, athleteId);
    }

    // 5) Crear vídeo
    @PostMapping
    public SessionVideo create(@RequestBody SessionVideo video) {
        if (video.getCreatedAt() == null) {
            video.setCreatedAt(OffsetDateTime.now());
        }
        return repository.save(video);
    }

    // 6) Borrar vídeo (por si se sube mal)
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}