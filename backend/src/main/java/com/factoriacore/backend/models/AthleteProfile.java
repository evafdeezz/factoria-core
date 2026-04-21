package com.factoriacore.backend.models;

import com.factoriacore.backend.models.enums.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "athlete_profiles")
public class AthleteProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "sex", nullable = false)
    private Gender sex;

    @Enumerated(EnumType.STRING)
    @Column(name = "discipline", nullable = false)
    private DisciplineType discipline = DisciplineType.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "distance_profile", nullable = false)
    private DistanceProfile distanceProfile = DistanceProfile.MIXTO;

    @Enumerated(EnumType.STRING)
    @Column(name = "training_slot")
    private TrainingSlot trainingSlot;

    @Enumerated(EnumType.STRING)
    @Column(name = "competition_category")
    private CompetitionCategory competitionCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "primary_event")
    private PrimaryEvent primaryEvent;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "menstrual_tracking_enabled", nullable = false)
    private boolean menstrualTrackingEnabled = false;

    @Column(name = "share_menstrual_data_with_coach", nullable = false)
    private boolean shareMenstrualDataWithCoach = false;

    @Column(name = "cycle_length")
    private Integer cycleLength;

    @Column(name = "menstrual_duration")
    private Integer menstrualDuration;

    @Column(name = "last_period_date")
    private LocalDate lastPeriodDate;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "notes", length = 1000)
    private String notes;

    @JsonIgnore
    @OneToMany(mappedBy = "athlete", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<MenstrualCycle> menstrualCycles = new ArrayList<>();

    public AthleteProfile() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @JsonIgnore
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public Gender getSex() { return sex; }
    public void setSex(Gender sex) { this.sex = sex; }

    public DisciplineType getDiscipline() { return discipline; }
    public void setDiscipline(DisciplineType discipline) { this.discipline = discipline; }

    public DistanceProfile getDistanceProfile() { return distanceProfile; }
    public void setDistanceProfile(DistanceProfile distanceProfile) { this.distanceProfile = distanceProfile; }

    public TrainingSlot getTrainingSlot() { return trainingSlot; }
    public void setTrainingSlot(TrainingSlot trainingSlot) { this.trainingSlot = trainingSlot; }

    public CompetitionCategory getCompetitionCategory() { return competitionCategory; }
    public void setCompetitionCategory(CompetitionCategory competitionCategory) { this.competitionCategory = competitionCategory; }

    public PrimaryEvent getPrimaryEvent() { return primaryEvent; }
    public void setPrimaryEvent(PrimaryEvent primaryEvent) { this.primaryEvent = primaryEvent; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public boolean isMenstrualTrackingEnabled() { return menstrualTrackingEnabled; }
    public void setMenstrualTrackingEnabled(boolean menstrualTrackingEnabled) { this.menstrualTrackingEnabled = menstrualTrackingEnabled; }

    public boolean isShareMenstrualDataWithCoach() { return shareMenstrualDataWithCoach; }
    public void setShareMenstrualDataWithCoach(boolean shareMenstrualDataWithCoach) { this.shareMenstrualDataWithCoach = shareMenstrualDataWithCoach; }

    public Integer getCycleLength() { return cycleLength; }
    public void setCycleLength(Integer cycleLength) { this.cycleLength = cycleLength; }

    public Integer getMenstrualDuration() { return menstrualDuration; }
    public void setMenstrualDuration(Integer menstrualDuration) { this.menstrualDuration = menstrualDuration; }

    public LocalDate getLastPeriodDate() { return lastPeriodDate; }
    public void setLastPeriodDate(LocalDate lastPeriodDate) { this.lastPeriodDate = lastPeriodDate; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    @JsonIgnore
    public List<MenstrualCycle> getMenstrualCycles() { return menstrualCycles; }
    public void setMenstrualCycles(List<MenstrualCycle> menstrualCycles) { this.menstrualCycles = menstrualCycles; }
}