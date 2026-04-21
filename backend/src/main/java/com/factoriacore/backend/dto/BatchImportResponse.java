package com.factoriacore.backend.dto;

import java.util.List;

public class BatchImportResponse {

    private int sessionsCreated;
    private int blocksCreated;
    private List<Long> sessionIds;
    private String summary;

    public BatchImportResponse() {}

    public BatchImportResponse(int sessionsCreated, int blocksCreated,
                               List<Long> sessionIds, String summary) {
        this.sessionsCreated = sessionsCreated;
        this.blocksCreated = blocksCreated;
        this.sessionIds = sessionIds;
        this.summary = summary;
    }

    public int getSessionsCreated() { return sessionsCreated; }
    public void setSessionsCreated(int sessionsCreated) { this.sessionsCreated = sessionsCreated; }

    public int getBlocksCreated() { return blocksCreated; }
    public void setBlocksCreated(int blocksCreated) { this.blocksCreated = blocksCreated; }

    public List<Long> getSessionIds() { return sessionIds; }
    public void setSessionIds(List<Long> sessionIds) { this.sessionIds = sessionIds; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
}