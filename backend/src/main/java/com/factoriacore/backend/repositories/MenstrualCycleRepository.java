package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.MenstrualCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenstrualCycleRepository extends JpaRepository<MenstrualCycle, Long>
{
    List<MenstrualCycle> findByAthlete_IdOrderByStartDateDesc(Long athleteId);
}