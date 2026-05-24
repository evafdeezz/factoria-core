package com.factoriacore.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "session_results")
public class SessionResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private TrainingSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "athlete_id", nullable = false)
    private AthleteProfile athlete;

    @Column(name = "time_main", length = 5000)
    private String timeMain;

    @Column(name = "rpe")
    private Integer rpe;

    @Column(name = "comment", length = 1000)
    private String comment;

    @Column(name = "pain_flag", nullable = false)
    private boolean painFlag = false;

    @Column(name = "pain_notes", length = 1000)
    private String painNotes;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Column(name = "recorded_at", nullable = false)
    private OffsetDateTime recordedAt;

    public SessionResult() {
        this.recordedAt = OffsetDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (recordedAt == null) recordedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @JsonIgnore
    public TrainingSession getSession() { return session; }
    @JsonProperty("session")
    public void setSession(TrainingSession session) { this.session = session; }
    public Long getSessionId() {
        return session != null ? session.getId() : null;
    }

    @JsonIgnore
    public AthleteProfile getAthlete() { return athlete; }
    @JsonProperty("athlete")
    public void setAthlete(AthleteProfile athlete) { this.athlete = athlete; }
    public Long getAthleteId() {
        return athlete != null ? athlete.getId() : null;
    }

    public String getTimeMain() { return timeMain; }
    public void setTimeMain(String timeMain) { this.timeMain = timeMain; }

    public Integer getRpe() { return rpe; }
    public void setRpe(Integer rpe) { this.rpe = rpe; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public boolean isPainFlag() { return painFlag; }
    public void setPainFlag(boolean painFlag) { this.painFlag = painFlag; }

    public String getPainNotes() { return painNotes; }
    public void setPainNotes(String painNotes) { this.painNotes = painNotes; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public OffsetDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(OffsetDateTime recordedAt) { this.recordedAt = recordedAt; }
}