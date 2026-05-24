package com.factoriacore.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(
        name = "group_members",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"group_id", "athlete_id"})
        }
)
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "athlete_id", nullable = false)
    private AthleteProfile athlete;

    @Column(name = "joined_at", nullable = false)
    private OffsetDateTime joinedAt;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public GroupMember() {
        this.joinedAt = OffsetDateTime.now();
    }

    public GroupMember(Group group, AthleteProfile athlete) {
        this.group = group;
        this.athlete = athlete;
        this.joinedAt = OffsetDateTime.now();
        this.active = true;
    }

    @PrePersist
    public void prePersist() {
        if (joinedAt == null) joinedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @JsonIgnore
    public Group getGroup() { return group; }
    @JsonProperty("group")
    public void setGroup(Group group) { this.group = group; }

    // Se expone solo el ID para evitar cargar todo el grupo al serializar
    public Long getGroupId() {
        return group != null ? group.getId() : null;
    }

    @JsonIgnore
    public AthleteProfile getAthlete() { return athlete; }
    @JsonProperty("athlete")
    public void setAthlete(AthleteProfile athlete) { this.athlete = athlete; }

    // Se expone solo el ID para evitar cargar todo el perfil del deportista
    public Long getAthleteId() {
        return athlete != null ? athlete.getId() : null;
    }

    public OffsetDateTime getJoinedAt() { return joinedAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public void setJoinedAt(OffsetDateTime joinedAt) { this.joinedAt = joinedAt; }
}