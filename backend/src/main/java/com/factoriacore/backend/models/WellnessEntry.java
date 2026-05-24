package com.factoriacore.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "wellness_entries")
public class WellnessEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Se mantiene accesible para que Jackson pueda asignar el deportista al recibir JSON
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "athlete_id", nullable = false)
    private AthleteProfile athlete;

    @Column(name = "entry_date", nullable = false)
    private LocalDate date;

    @Column(name = "sleep_hours")
    private Double sleepHours;

    @Column(name = "fatigue")
    private Integer fatigue;

    @Column(name = "soreness")
    private Integer soreness;

    @Column(name = "stress")
    private Integer stress;

    @Column(name = "mood")
    private Integer mood;

    @Column(name = "comment", length = 1000)
    private String comment;

    public WellnessEntry() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @JsonIgnore
    public AthleteProfile getAthlete() { return athlete; }

    @JsonProperty("athlete")
    public void setAthlete(AthleteProfile athlete) { this.athlete = athlete; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Double getSleepHours() { return sleepHours; }
    public void setSleepHours(Double sleepHours) { this.sleepHours = sleepHours; }

    public Integer getFatigue() { return fatigue; }
    public void setFatigue(Integer fatigue) { this.fatigue = fatigue; }

    public Integer getSoreness() { return soreness; }
    public void setSoreness(Integer soreness) { this.soreness = soreness; }

    public Integer getStress() { return stress; }
    public void setStress(Integer stress) { this.stress = stress; }

    public Integer getMood() { return mood; }
    public void setMood(Integer mood) { this.mood = mood; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}