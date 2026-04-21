package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.Group;
import com.factoriacore.backend.models.enums.DisciplineType;
import com.factoriacore.backend.models.enums.DistanceProfile;
import com.factoriacore.backend.models.enums.TrainingSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GroupRepository extends JpaRepository<Group, Long>
{
    List<Group> findByCoachId(Long coachId);
    List<Group> findByActiveTrue();
    Optional<Group> findByJoinCode(String joinCode);

    List<Group> findByDiscipline(DisciplineType discipline);
    List<Group> findByDistanceProfile(DistanceProfile distanceProfile);
    List<Group> findByTrainingSlot(TrainingSlot trainingSlot);
    List<Group> findByCoachIdAndActiveTrue(Long coachId);
}

