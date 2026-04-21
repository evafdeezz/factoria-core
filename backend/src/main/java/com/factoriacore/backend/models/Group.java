package com.factoriacore.backend.models;

import com.factoriacore.backend.models.enums.CompetitionCategory;
import com.factoriacore.backend.models.enums.DisciplineType;
import com.factoriacore.backend.models.enums.DistanceProfile;
import com.factoriacore.backend.models.enums.TrainingSlot;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "groups")
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "coach_id", nullable = false)
    private Long coachId;

    @Enumerated(EnumType.STRING)
    @Column(name = "competition_category")
    private CompetitionCategory competitionCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "discipline", nullable = false)
    private DisciplineType discipline = DisciplineType.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "distance_profile", nullable = false)
    private DistanceProfile distanceProfile = DistanceProfile.MIXTO;

    @Enumerated(EnumType.STRING)
    @Column(name = "training_slot")
    private TrainingSlot trainingSlot;

    @Column(name = "join_code", unique = true, length = 50)
    private String joinCode;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public Group() {
        this.createdAt = OffsetDateTime.now();
    }

    public Group(Long id,
                 String name,
                 String description,
                 Long coachId,
                 CompetitionCategory competitionCategory,
                 DisciplineType discipline,
                 DistanceProfile distanceProfile,
                 TrainingSlot trainingSlot,
                 String joinCode,
                 boolean active,
                 OffsetDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.coachId = coachId;
        this.competitionCategory = competitionCategory;
        this.discipline = discipline;
        this.distanceProfile = distanceProfile;
        this.trainingSlot = trainingSlot;
        this.joinCode = joinCode;
        this.active = active;
        this.createdAt = createdAt;
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Long getCoachId() {
        return coachId;
    }

    public CompetitionCategory getCompetitionCategory() {
        return competitionCategory;
    }

    public DisciplineType getDiscipline() {
        return discipline;
    }

    public DistanceProfile getDistanceProfile() {
        return distanceProfile;
    }

    public TrainingSlot getTrainingSlot() {
        return trainingSlot;
    }

    public String getJoinCode() {
        return joinCode;
    }

    public boolean isActive() {
        return active;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setCoachId(Long coachId) {
        this.coachId = coachId;
    }

    public void setCompetitionCategory(CompetitionCategory competitionCategory) {
        this.competitionCategory = competitionCategory;
    }

    public void setDiscipline(DisciplineType discipline) {
        this.discipline = discipline;
    }

    public void setDistanceProfile(DistanceProfile distanceProfile) {
        this.distanceProfile = distanceProfile;
    }

    public void setTrainingSlot(TrainingSlot trainingSlot) {
        this.trainingSlot = trainingSlot;
    }

    public void setJoinCode(String joinCode) {
        this.joinCode = joinCode;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}