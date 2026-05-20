package com.factoriacore.backend.models;

import com.factoriacore.backend.models.enums.PersonalSessionType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "personal_sessions")
public class PersonalSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "athlete_id", nullable = false)
    private AthleteProfile athlete;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private PersonalSessionType type;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public PersonalSession() {
        this.createdAt = OffsetDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @JsonIgnore
    public AthleteProfile getAthlete() { return athlete; }
    @JsonProperty("athlete")
    public void setAthlete(AthleteProfile athlete) { this.athlete = athlete; }
    public Long getAthleteId() { return athlete != null ? athlete.getId() : null; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public PersonalSessionType getType() { return type; }
    public void setType(PersonalSessionType type) { this.type = type; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}