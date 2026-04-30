package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.AthleteProfile;
import com.factoriacore.backend.models.Group;
import com.factoriacore.backend.models.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long>
{
    List<GroupMember> findByGroup_IdAndActiveTrue(Long groupId);
    List<GroupMember> findByAthlete_IdAndActiveTrue(Long athleteId);

    Optional<GroupMember> findByGroupAndAthlete(Group group, AthleteProfile athlete);

    boolean existsByGroupAndAthlete(Group group, AthleteProfile athlete);
    boolean existsByAthlete_IdAndGroup_CoachId(Long athleteId, Long coachId);

    // Returns groupIds directly to avoid lazy-loading Group in controllers
    @Query("SELECT gm.group.id FROM GroupMember gm WHERE gm.athlete.id = :athleteId AND gm.active = true")
    List<Long> findActiveGroupIdsByAthleteId(@Param("athleteId") Long athleteId);

    // JOIN FETCH to load athlete + user in one query (for detailed endpoint)
    @Query("SELECT gm FROM GroupMember gm JOIN FETCH gm.athlete a JOIN FETCH a.user WHERE gm.group.id = :groupId AND gm.active = true")
    List<GroupMember> findDetailedByGroupId(@Param("groupId") Long groupId);
}