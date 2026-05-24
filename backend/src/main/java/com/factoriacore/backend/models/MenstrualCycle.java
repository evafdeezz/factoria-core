package com.factoriacore.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "menstrual_cycles")
public class MenstrualCycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "athlete_id", nullable = false)
    private AthleteProfile athlete;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "cycle_length")
    private Integer cycleLength;

    @Column(name = "bleeding_days")
    private Integer bleedingDays;

    @OneToMany(mappedBy = "cycle", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<MenstrualEntry> entries = new ArrayList<>();

    public MenstrualCycle() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @JsonIgnore
    public AthleteProfile getAthlete() { return athlete; }
    @JsonProperty("athlete")
    public void setAthlete(AthleteProfile athlete) { this.athlete = athlete; }

    public Long getAthleteId() { return athlete != null ? athlete.getId() : null; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public Integer getCycleLength() { return cycleLength; }
    public void setCycleLength(Integer cycleLength) { this.cycleLength = cycleLength; }

    public Integer getBleedingDays() { return bleedingDays; }
    public void setBleedingDays(Integer bleedingDays) { this.bleedingDays = bleedingDays; }

    @JsonIgnore
    public List<MenstrualEntry> getEntries() { return entries; }
    public void setEntries(List<MenstrualEntry> entries) { this.entries = entries; }
}