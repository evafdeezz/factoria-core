package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.SessionVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionVideoRepository extends JpaRepository<SessionVideo, Long>
{
    // vídeos de una sesión
    List<SessionVideo> findBySessionId(Long sessionId);

    // vídeos de un atleta
    List<SessionVideo> findByAthleteId(Long athleteId);

    // vídeos de un atleta en una sesión concreta
    List<SessionVideo> findBySessionIdAndAthleteId(Long sessionId, Long athleteId);
}
