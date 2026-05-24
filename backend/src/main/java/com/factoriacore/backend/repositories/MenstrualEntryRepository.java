package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.MenstrualEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MenstrualEntryRepository extends JpaRepository<MenstrualEntry, Long> {
    List<MenstrualEntry> findByCycle_IdOrderByDateAsc(Long cycleId);
    Optional<MenstrualEntry> findByCycle_IdAndDate(Long cycleId, LocalDate date);
}