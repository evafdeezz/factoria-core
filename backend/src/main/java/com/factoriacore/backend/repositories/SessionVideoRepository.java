package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.SessionVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionVideoRepository extends JpaRepository<SessionVideo, Long> {

    List<SessionVideo> findBySession_Id(Long sessionId);

    List<SessionVideo> findByAthlete_Id(Long athleteId);

    List<SessionVideo> findBySession_IdAndAthlete_Id(Long sessionId, Long athleteId);
}