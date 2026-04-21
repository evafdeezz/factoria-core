package com.factoriacore.backend.models;

import com.factoriacore.backend.models.enums.SessionStatus;
import com.factoriacore.backend.models.enums.TrainingSource;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "training_sessions")
public class TrainingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Column(name = "coach_id", nullable = false)
    private Long coachId;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false)
    private TrainingSource source = TrainingSource.MANUAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SessionStatus status = SessionStatus.PLANNED;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public TrainingSession() {
        this.createdAt = OffsetDateTime.now();
    }

    public TrainingSession(LocalDate date, String title, String description,
                           Group group, Long coachId, TrainingSource source,
                           SessionStatus status, String rawText) {
        this.date = date;
        this.title = title;
        this.description = description;
        this.group = group;
        this.coachId = coachId;
        this.source = source;
        this.status = status;
        this.rawText = rawText;
        this.createdAt = OffsetDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    // Serialize as groupId only, accept full group object on deserialization
    @JsonIgnore
    public Group getGroup() { return group; }
    @JsonProperty("group")
    public void setGroup(Group group) { this.group = group; }

    // Expose groupId for serialization so frontend gets it without lazy-loading Group
    public Long getGroupId() {
        return group != null ? group.getId() : null;
    }

    public Long getCoachId() { return coachId; }
    public void setCoachId(Long coachId) { this.coachId = coachId; }

    public TrainingSource getSource() { return source; }
    public void setSource(TrainingSource source) { this.source = source; }

    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }

    public String getRawText() { return rawText; }
    public void setRawText(String rawText) { this.rawText = rawText; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}