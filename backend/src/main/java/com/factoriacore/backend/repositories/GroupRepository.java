package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GroupRepository extends JpaRepository<Group, Long>
{
    List<Group> findByCoachId(Long coachId);
    Optional<Group> findByJoinCode(String joinCode);
}

