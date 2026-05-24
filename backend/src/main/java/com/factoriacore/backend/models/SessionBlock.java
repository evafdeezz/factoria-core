package com.factoriacore.backend.models;

import com.factoriacore.backend.models.enums.BlockTarget;
import com.factoriacore.backend.models.enums.BlockType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "session_blocks")
public class SessionBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private TrainingSession session;

    @Column(name = "block_order", nullable = false)
    private Integer blockOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "block_type", nullable = false)
    private BlockType blockType = BlockType.OTHER;

    @Enumerated(EnumType.STRING)
    @Column(name = "target", nullable = false)
    private BlockTarget target = BlockTarget.ALL;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    public SessionBlock() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @JsonIgnore
    public TrainingSession getSession() { return session; }
    @JsonProperty("session")
    public void setSession(TrainingSession session) { this.session = session; }

    public Integer getBlockOrder() { return blockOrder; }
    public void setBlockOrder(Integer blockOrder) { this.blockOrder = blockOrder; }

    public BlockType getBlockType() { return blockType; }
    public void setBlockType(BlockType blockType) { this.blockType = blockType; }

    public BlockTarget getTarget() { return target; }
    public void setTarget(BlockTarget target) { this.target = target; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}