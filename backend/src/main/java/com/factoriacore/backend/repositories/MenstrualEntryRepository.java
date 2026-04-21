package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.MenstrualEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MenstrualEntryRepository extends JpaRepository<MenstrualEntry, Long>
{
    List<MenstrualEntry> findByAthlete_IdOrderByDateDesc(Long athleteId);
    Optional<MenstrualEntry> findByAthlete_IdAndDate(Long athleteId, LocalDate date);
}