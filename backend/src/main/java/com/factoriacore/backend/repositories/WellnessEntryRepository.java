package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.AthleteProfile;
import com.factoriacore.backend.models.WellnessEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WellnessEntryRepository extends JpaRepository<WellnessEntry, Long>
{
    List<WellnessEntry> findByAthlete_IdOrderByDateDesc(Long athleteId);
    Optional<WellnessEntry> findByAthleteAndDate(AthleteProfile athlete, LocalDate date);
    Optional<WellnessEntry> findByAthlete_IdAndDate(Long athleteId, LocalDate date);
}