package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.TrainingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long>
{
    List<TrainingSession> findByGroup_Id(Long groupId);
    List<TrainingSession> findByCoachId(Long coachId);
    List<TrainingSession> findByGroup_IdAndDate(Long groupId, LocalDate date);
}