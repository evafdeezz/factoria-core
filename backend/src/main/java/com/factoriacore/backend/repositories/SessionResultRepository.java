package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.AthleteProfile;
import com.factoriacore.backend.models.SessionResult;
import com.factoriacore.backend.models.TrainingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SessionResultRepository extends JpaRepository<SessionResult, Long>
{
    List<SessionResult> findByAthlete_IdOrderByRecordedAtDesc(Long athleteId);
    List<SessionResult> findBySession_IdOrderByRecordedAtDesc(Long sessionId);

    Optional<SessionResult> findBySessionAndAthlete(TrainingSession session, AthleteProfile athlete);
}