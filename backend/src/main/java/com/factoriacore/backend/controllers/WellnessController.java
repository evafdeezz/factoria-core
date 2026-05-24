package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.AthleteProfile;
import com.factoriacore.backend.models.WellnessEntry;
import com.factoriacore.backend.repositories.AthleteProfileRepository;
import com.factoriacore.backend.repositories.WellnessEntryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/wellness")
public class WellnessController {

    private final WellnessEntryRepository repository;
    private final AthleteProfileRepository athleteProfileRepository;

    public WellnessController(WellnessEntryRepository repository,
                              AthleteProfileRepository athleteProfileRepository) {
        this.repository = repository;
        this.athleteProfileRepository = athleteProfileRepository;
    }

    @GetMapping
    public List<WellnessEntry> getAll() {
        return repository.findAll();
    }

    @GetMapping("/athlete/{athleteId}")
    public List<WellnessEntry> getByAthlete(@PathVariable Long athleteId) {
        return repository.findByAthlete_IdOrderByDateDesc(athleteId);
    }

    @GetMapping("/athlete/{athleteId}/date/{date}")
    public ResponseEntity<WellnessEntry> getByAthleteAndDate(@PathVariable Long athleteId,
                                                             @PathVariable String date) {
        LocalDate entryDate = LocalDate.parse(date);
        return repository.findByAthlete_IdAndDate(athleteId, entryDate)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public WellnessEntry createOrUpdate(@RequestBody WellnessEntry request) {
        if (request.getAthlete() == null || request.getAthlete().getId() == null) {
            throw new IllegalArgumentException("athlete.id es obligatorio");
        }
        if (request.getDate() == null) {
            throw new IllegalArgumentException("date es obligatorio");
        }

        AthleteProfile athlete = athleteProfileRepository.findById(request.getAthlete().getId())
                .orElseThrow(() -> new RuntimeException("Athlete not found"));

        Optional<WellnessEntry> existingOpt = repository.findByAthleteAndDate(athlete, request.getDate());

        WellnessEntry toSave = existingOpt.orElseGet(WellnessEntry::new);
        toSave.setAthlete(athlete);
        toSave.setDate(request.getDate());
        toSave.setSleepHours(request.getSleepHours());
        toSave.setFatigue(request.getFatigue());
        toSave.setSoreness(request.getSoreness());
        toSave.setStress(request.getStress());
        toSave.setMood(request.getMood());
        toSave.setComment(request.getComment());

        return repository.save(toSave);
    }
}