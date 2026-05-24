package com.factoriacore.backend.dto;

import com.factoriacore.backend.models.enums.BlockTarget;
import com.factoriacore.backend.models.enums.BlockType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BatchImportRequest {

    private List<Long> groupIds;
    private Long coachId;
    private Integer year;
    private Integer month;
    private String dayOfWeek;
    private List<BlockData> blocks;
    private String rawText;

    public BatchImportRequest() {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BlockData {
        private Integer blockOrder;
        private BlockType blockType;
        private BlockTarget target;
        private String title;
        private String description;
        private String descriptionDescarga;
        private boolean skipOnDescarga;

        public BlockData() {
        }

        public Integer getBlockOrder() {
            return blockOrder;
        }

        public void setBlockOrder(Integer blockOrder) {
            this.blockOrder = blockOrder;
        }

        public BlockType getBlockType() {
            return blockType;
        }

        public BlockTarget getTarget() {
            return target;
        }

        public String getTitle() {
            return title;
        }

        public String getDescription() {
            return description;
        }

        public String getDescriptionDescarga() {
            return descriptionDescarga;
        }

        public boolean isSkipOnDescarga() {
            return skipOnDescarga;
        }
    }

    public List<Long> getGroupIds() {
        return groupIds;
    }

    public Long getCoachId() {
        return coachId;
    }

    public Integer getYear() {
        return year;
    }

    public Integer getMonth() {
        return month;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public List<BlockData> getBlocks() {
        return blocks;
    }
}