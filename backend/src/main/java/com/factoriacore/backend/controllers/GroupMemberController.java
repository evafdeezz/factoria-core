package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.AthleteProfile;
import com.factoriacore.backend.models.Group;
import com.factoriacore.backend.models.GroupMember;
import com.factoriacore.backend.repositories.AthleteProfileRepository;
import com.factoriacore.backend.repositories.GroupMemberRepository;
import com.factoriacore.backend.repositories.GroupRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/group-members")
public class GroupMemberController {

    private final GroupMemberRepository repository;
    private final GroupRepository groupRepository;
    private final AthleteProfileRepository athleteProfileRepository;

    public GroupMemberController(GroupMemberRepository repository,
                                 GroupRepository groupRepository,
                                 AthleteProfileRepository athleteProfileRepository) {
        this.repository = repository;
        this.groupRepository = groupRepository;
        this.athleteProfileRepository = athleteProfileRepository;
    }

    public static class GroupMemberDetailDto {
        public Long id;
        public Long groupId;
        public Long athleteId;
        public Long athleteUserId;    // User.id — used for coach routing
        public String athleteName;    // User.fullName
        public String athletePicture; // User.pictureUrl
        public String joinedAt;
        public boolean active;
    }

    @GetMapping
    public List<GroupMember> getAll() {
        return repository.findAll();
    }

    @GetMapping("/by-group/{groupId}")
    public List<GroupMember> getByGroup(@PathVariable Long groupId) {
        return repository.findByGroup_IdAndActiveTrue(groupId);
    }

    @GetMapping("/by-group/{groupId}/detailed")
    public List<GroupMemberDetailDto> getDetailedByGroup(@PathVariable Long groupId) {
        List<GroupMember> members = repository.findDetailedByGroupId(groupId);
        return members.stream().map(m -> {
            GroupMemberDetailDto dto = new GroupMemberDetailDto();
            dto.id          = m.getId();
            dto.groupId     = m.getGroup().getId();
            dto.athleteId   = m.getAthlete().getId();
            dto.athleteUserId   = m.getAthlete().getUser().getId();
            dto.athleteName     = m.getAthlete().getUser().getFullName();
            dto.athletePicture  = m.getAthlete().getUser().getPictureUrl();
            dto.joinedAt    = m.getJoinedAt() != null ? m.getJoinedAt().toString() : null;
            dto.active      = m.isActive();
            return dto;
        }).collect(Collectors.toList());
    }

    @GetMapping("/by-athlete/{athleteId}")
    public List<GroupMember> getByAthlete(@PathVariable Long athleteId) {
        return repository.findByAthlete_IdAndActiveTrue(athleteId);
    }

    @PostMapping
    public GroupMember addMember(@RequestParam Long groupId, @RequestParam Long athleteId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        AthleteProfile athlete = athleteProfileRepository.findById(athleteId)
                .orElseThrow(() -> new RuntimeException("Athlete not found"));

        if (repository.existsByGroupAndAthlete(group, athlete)) {
            return repository.findByGroupAndAthlete(group, athlete)
                    .orElseThrow(() -> new RuntimeException("Membership already exists"));
        }

        return repository.save(new GroupMember(group, athlete));
    }

    @DeleteMapping("/{id}")
    public void deactivateMember(@PathVariable Long id) {
        GroupMember member = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("GroupMember not found"));
        member.setActive(false);
        repository.save(member);
    }
}