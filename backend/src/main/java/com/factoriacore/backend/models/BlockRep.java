package com.factoriacore.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "block_reps")
public class BlockRep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "block_id", nullable = false)
    private SessionBlock block;

    @Column(name = "rep_order")
    private Integer repOrder;

    @Column(name = "value", length = 100)
    private String value;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "notes", length = 500)
    private String notes;

    public BlockRep() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @JsonIgnore
    public SessionBlock getBlock() { return block; }
    @JsonProperty("block")
    public void setBlock(SessionBlock block) { this.block = block; }

    public Long getBlockId() {
        return block != null ? block.getId() : null;
    }

    public Integer getRepOrder() { return repOrder; }
    public void setRepOrder(Integer repOrder) { this.repOrder = repOrder; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}