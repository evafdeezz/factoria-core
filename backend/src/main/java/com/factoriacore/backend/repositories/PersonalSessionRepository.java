package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.PersonalSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PersonalSessionRepository extends JpaRepository<PersonalSession, Long> {
    List<PersonalSession> findByAthlete_IdOrderByDateDesc(Long athleteId);
}