package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.MenstrualCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MenstrualCycleRepository extends JpaRepository<MenstrualCycle, Long> {

    List<MenstrualCycle> findByAthlete_IdOrderByStartDateDesc(Long athleteId);
    Optional<MenstrualCycle> findByAthlete_IdAndStartDate(Long athleteId, LocalDate startDate);
}