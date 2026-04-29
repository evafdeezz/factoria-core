package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.Group;
import com.factoriacore.backend.repositories.GroupRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupRepository repository;
    private final Random random = new Random();

    public GroupController(GroupRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Group> getAllGroups() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Group getGroup(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GROUP_NOT_FOUND"));
    }

    @GetMapping("/coach/{coachId}")
    public List<Group> getGroupsByCoach(@PathVariable Long coachId) {
        return repository.findByCoachId(coachId);
    }

    @GetMapping("/join/{joinCode}")
    public Group getGroupByJoinCode(@PathVariable String joinCode) {
        return repository.findByJoinCode(joinCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GROUP_NOT_FOUND"));
    }

    @PostMapping
    public ResponseEntity<Group> createGroup(@RequestBody Group group) {
        group.setJoinCode(generateUniqueJoinCode());
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(group));
    }

    @PutMapping("/{id}")
    public Group updateGroup(@PathVariable Long id, @RequestBody Group incoming) {
        Group existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GROUP_NOT_FOUND"));

        if (incoming.getName() != null)                existing.setName(incoming.getName());
        existing.setDescription(incoming.getDescription());
        if (incoming.getCompetitionCategory() != null) existing.setCompetitionCategory(incoming.getCompetitionCategory());
        if (incoming.getDiscipline() != null)          existing.setDiscipline(incoming.getDiscipline());
        if (incoming.getDistanceProfile() != null)     existing.setDistanceProfile(incoming.getDistanceProfile());
        existing.setActive(incoming.isActive());

        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "GROUP_NOT_FOUND");
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String generateUniqueJoinCode() {
        String code;
        int attempts = 0;
        do {
            code = randomLetters() + String.format("%03d", random.nextInt(1000));
            if (++attempts > 200) throw new RuntimeException("No se pudo generar un código único");
        } while (repository.findByJoinCode(code).isPresent());
        return code;
    }

    private String randomLetters() {
        return String.valueOf((char) ('A' + random.nextInt(26)))
                + (char) ('A' + random.nextInt(26));
    }
}