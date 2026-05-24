package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.TrainingSession;
import com.factoriacore.backend.repositories.GroupMemberRepository;
import com.factoriacore.backend.repositories.TrainingSessionRepository;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/athletes")
public class AthleteTrainingController {

    private final GroupMemberRepository groupMemberRepository;
    private final TrainingSessionRepository sessionRepository;

    public AthleteTrainingController(GroupMemberRepository groupMemberRepository,
                                     TrainingSessionRepository sessionRepository) {
        this.groupMemberRepository = groupMemberRepository;
        this.sessionRepository = sessionRepository;
    }

    /**
     * GET — obtiene las sesiones de entrenamiento de hoy para un deportista.
     *
     * Primero se consultan los grupos activos del deportista y después se buscan
     * las sesiones programadas para la fecha actual en cada uno de esos grupos.
     */
    @GetMapping("/{athleteId}/sessions/today")
    public List<TrainingSession> getTodaySessionsForAthlete(@PathVariable Long athleteId) {
        // Se obtienen solo los IDs para evitar cargar grupos completos innecesariamente
        List<Long> groupIds = groupMemberRepository.findActiveGroupIdsByAthleteId(athleteId);

        Map<Long, TrainingSession> sessionMap = new LinkedHashMap<>();
        for (Long groupId : groupIds) {
            List<TrainingSession> sessions = sessionRepository.findByGroup_IdAndDate(groupId, LocalDate.now());
            for (TrainingSession s : sessions) {
                if (s.getId() != null) sessionMap.putIfAbsent(s.getId(), s);
            }
        }

        return sessionMap.values().stream()
                .sorted(Comparator.comparing(TrainingSession::getDate).reversed())
                .collect(Collectors.toList());
    }

    /**
     * GET — obtiene todas las sesiones asociadas a los grupos del deportista.
     *
     * Sirve para mostrar el historial completo de entrenamientos disponibles
     * para ese deportista, ordenado desde las sesiones más recientes.
     */
    @GetMapping("/{athleteId}/sessions")
    public List<TrainingSession> getAllSessionsForAthlete(@PathVariable Long athleteId) {
        List<Long> groupIds = groupMemberRepository.findActiveGroupIdsByAthleteId(athleteId);

        Map<Long, TrainingSession> sessionMap = new LinkedHashMap<>();
        for (Long groupId : groupIds) {
            List<TrainingSession> sessions = sessionRepository.findByGroup_Id(groupId);
            for (TrainingSession s : sessions) {
                if (s.getId() != null) sessionMap.putIfAbsent(s.getId(), s);
            }
        }

        return sessionMap.values().stream()
                .sorted(Comparator.comparing(TrainingSession::getDate).reversed())
                .collect(Collectors.toList());
    }
}