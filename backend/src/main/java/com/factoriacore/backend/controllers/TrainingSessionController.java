package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.Group;
import com.factoriacore.backend.models.TrainingSession;
import com.factoriacore.backend.repositories.GroupRepository;
import com.factoriacore.backend.repositories.TrainingSessionRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class TrainingSessionController {

    private final TrainingSessionRepository repository;
    private final GroupRepository groupRepository;

    public TrainingSessionController(TrainingSessionRepository repository,
                                     GroupRepository groupRepository) {
        this.repository = repository;
        this.groupRepository = groupRepository;
    }

    @GetMapping
    public List<TrainingSession> getAllSessions() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public TrainingSession getSessionById(@PathVariable Long id) {
        return repository.findById(id).orElse(null);
    }

    @PostMapping
    public TrainingSession createSession(@RequestBody TrainingSession request) {
        if (request.getGroup() == null || request.getGroup().getId() == null) {
            throw new IllegalArgumentException("group.id es obligatorio");
        }
        Group group = groupRepository.findById(request.getGroup().getId())
                .orElseThrow(() -> new RuntimeException("Group not found"));
        request.setGroup(group);
        return repository.save(request);
    }

    @PutMapping("/{id}")
    public TrainingSession updateSession(@PathVariable Long id, @RequestBody TrainingSession incoming) {
        TrainingSession existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (incoming.getDate() != null)      existing.setDate(incoming.getDate());
        if (incoming.getStartTime() != null) existing.setStartTime(incoming.getStartTime());
        if (incoming.getTitle() != null)     existing.setTitle(incoming.getTitle());
        existing.setDescription(incoming.getDescription());

        if (incoming.getGroup() != null && incoming.getGroup().getId() != null) {
            Group group = groupRepository.findById(incoming.getGroup().getId())
                    .orElseThrow(() -> new RuntimeException("Group not found"));
            existing.setGroup(group);
        }

        existing.setCoachId(incoming.getCoachId());

        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    public void deleteSession(@PathVariable Long id) {
        repository.deleteById(id);
    }

    @GetMapping("/group/{groupId}")
    public List<TrainingSession> getSessionsByGroup(@PathVariable Long groupId) {
        return repository.findByGroup_Id(groupId);
    }

    @GetMapping("/group/{groupId}/today")
    public List<TrainingSession> getTodaySessionsByGroup(@PathVariable Long groupId) {
        return repository.findByGroup_IdAndDate(groupId, LocalDate.now());
    }

    @GetMapping("/coach/{coachId}")
    public List<TrainingSession> getSessionsByCoach(@PathVariable Long coachId) {
        return repository.findByCoachId(coachId);
    }
}