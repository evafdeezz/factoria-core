package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.SessionBlock;
import com.factoriacore.backend.models.TrainingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SessionBlockRepository extends JpaRepository<SessionBlock, Long>
{
    List<SessionBlock> findBySession(TrainingSession session);
    List<SessionBlock> findBySession_IdOrderByBlockOrderAsc(Long sessionId);
}