package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.SessionBlock;
import com.factoriacore.backend.models.TrainingSession;
import com.factoriacore.backend.repositories.SessionBlockRepository;
import com.factoriacore.backend.repositories.TrainingSessionRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/session-blocks")
public class SessionBlockController {

    private final SessionBlockRepository repository;
    private final TrainingSessionRepository trainingSessionRepository;

    public SessionBlockController(SessionBlockRepository repository,
                                  TrainingSessionRepository trainingSessionRepository) {
        this.repository = repository;
        this.trainingSessionRepository = trainingSessionRepository;
    }

    @GetMapping
    public List<SessionBlock> getAll() {
        return repository.findAll();
    }

    @GetMapping("/by-session/{sessionId}")
    public List<SessionBlock> getBySession(@PathVariable Long sessionId) {
        return repository.findBySession_IdOrderByBlockOrderAsc(sessionId);
    }

    @PostMapping
    public SessionBlock create(@RequestBody SessionBlock request) {
        if (request.getSession() == null || request.getSession().getId() == null) {
            throw new IllegalArgumentException("session.id es obligatorio");
        }
        TrainingSession session = trainingSessionRepository.findById(request.getSession().getId())
                .orElseThrow(() -> new RuntimeException("TrainingSession not found"));
        request.setSession(session);
        return repository.save(request);
    }

    @PutMapping("/{id}")
    public SessionBlock update(@PathVariable Long id, @RequestBody SessionBlock incoming) {
        SessionBlock existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("SessionBlock not found"));

        if (incoming.getBlockOrder() != null) existing.setBlockOrder(incoming.getBlockOrder());
        if (incoming.getBlockType() != null)  existing.setBlockType(incoming.getBlockType());
        if (incoming.getTarget() != null)     existing.setTarget(incoming.getTarget());
        existing.setTitle(incoming.getTitle());
        existing.setDescription(incoming.getDescription());

        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}