package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.User;
import com.factoriacore.backend.models.enums.UserRole;
import com.factoriacore.backend.repositories.UserRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository repository;

    public UserController(UserRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return repository.findAll();
    }

    @GetMapping("/coaches")
    public List<User> getCoaches() {
        return repository.findByRole(UserRole.COACH);
    }

    @GetMapping("/athletes")
    public List<User> getAthletes() {
        return repository.findByRole(UserRole.ATHLETE);
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return repository.findById(id).orElse(null);
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return repository.save(user);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User incoming) {
        User existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (incoming.getFullName() != null) {
            existing.setFullName(incoming.getFullName());
        }
        if (incoming.getGivenName() != null) {
            existing.setGivenName(incoming.getGivenName());
        }
        if (incoming.getBirthDate() != null) {
            existing.setBirthDate(incoming.getBirthDate());
        }
        if (incoming.getFamilyName() != null) {
            existing.setFamilyName(incoming.getFamilyName());
        }
        if (incoming.getEmail() != null) {
            existing.setEmail(incoming.getEmail());
        }
        if (incoming.getPictureUrl() != null) {
            existing.setPictureUrl(incoming.getPictureUrl());
        }
        if (incoming.getRole() != null) {
            existing.setRole(incoming.getRole());
        }

        existing.setActive(incoming.isActive());

        return repository.save(existing);
    }
}