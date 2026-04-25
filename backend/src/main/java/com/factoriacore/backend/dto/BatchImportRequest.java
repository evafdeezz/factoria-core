package com.factoriacore.backend.dto;

import com.factoriacore.backend.models.enums.BlockTarget;
import com.factoriacore.backend.models.enums.BlockType;

import java.util.List;

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

        public void setBlockType(BlockType blockType) {
            this.blockType = blockType;
        }

        public BlockTarget getTarget() {
            return target;
        }

        public void setTarget(BlockTarget target) {
            this.target = target;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getDescriptionDescarga() {
            return descriptionDescarga;
        }

        public void setDescriptionDescarga(String descriptionDescarga) {
            this.descriptionDescarga = descriptionDescarga;
        }

        public boolean isSkipOnDescarga() {
            return skipOnDescarga;
        }

        public void setSkipOnDescarga(boolean skipOnDescarga) {
            this.skipOnDescarga = skipOnDescarga;
        }
    }

    public List<Long> getGroupIds() {
        return groupIds;
    }

    public void setGroupIds(List<Long> groupIds) {
        this.groupIds = groupIds;
    }

    public Long getCoachId() {
        return coachId;
    }

    public void setCoachId(Long coachId) {
        this.coachId = coachId;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public List<BlockData> getBlocks() {
        return blocks;
    }

    public void setBlocks(List<BlockData> blocks) {
        this.blocks = blocks;
    }

    public String getRawText() {
        return rawText;
    }

    public void setRawText(String rawText) {
        this.rawText = rawText;
    }
}