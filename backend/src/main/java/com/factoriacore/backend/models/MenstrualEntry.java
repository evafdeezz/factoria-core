package com.factoriacore.backend.models;

import com.factoriacore.backend.models.enums.MenstrualPhase;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "menstrual_entries")
public class MenstrualEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cycle_id", nullable = false)
    private MenstrualCycle cycle;

    @Column(name = "entry_date", nullable = false)
    private LocalDate date;

    @Column(name = "cycle_day")
    private Integer cycleDay;

    @Enumerated(EnumType.STRING)
    @Column(name = "estimated_phase")
    private MenstrualPhase estimatedPhase;

    @Column(name = "pain_level")
    private Integer painLevel;

    @Column(name = "fatigue_level")
    private Integer fatigueLevel;

    @Column(name = "flow_level")
    private Integer flowLevel;

    @Column(name = "mood")
    private Integer mood;

    @Column(name = "notes", length = 1000)
    private String notes;

    public MenstrualEntry() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @JsonIgnore
    public MenstrualCycle getCycle() { return cycle; }
    @JsonProperty("cycle")
    public void setCycle(MenstrualCycle cycle) { this.cycle = cycle; }

    public Long getCycleId() { return cycle != null ? cycle.getId() : null; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Integer getCycleDay() { return cycleDay; }
    public void setCycleDay(Integer cycleDay) { this.cycleDay = cycleDay; }

    public MenstrualPhase getEstimatedPhase() { return estimatedPhase; }
    public void setEstimatedPhase(MenstrualPhase estimatedPhase) { this.estimatedPhase = estimatedPhase; }

    public Integer getPainLevel() { return painLevel; }
    public void setPainLevel(Integer painLevel) { this.painLevel = painLevel; }

    public Integer getFatigueLevel() { return fatigueLevel; }
    public void setFatigueLevel(Integer fatigueLevel) { this.fatigueLevel = fatigueLevel; }

    public Integer getFlowLevel() { return flowLevel; }
    public void setFlowLevel(Integer flowLevel) { this.flowLevel = flowLevel; }

    public Integer getMood() { return mood; }
    public void setMood(Integer mood) { this.mood = mood; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}