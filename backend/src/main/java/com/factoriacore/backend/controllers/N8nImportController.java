package com.factoriacore.backend.controllers;

import com.factoriacore.backend.dto.BatchImportResponse;
import com.factoriacore.backend.dto.BatchImportRequest;
import com.factoriacore.backend.models.Group;
import com.factoriacore.backend.models.SessionBlock;
import com.factoriacore.backend.models.TrainingSession;
import com.factoriacore.backend.repositories.GroupRepository;
import com.factoriacore.backend.repositories.SessionBlockRepository;
import com.factoriacore.backend.repositories.TrainingSessionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/n8n")
public class N8nImportController {

    private final TrainingSessionRepository sessionRepository;
    private final SessionBlockRepository blockRepository;
    private final GroupRepository groupRepository;

    public N8nImportController(TrainingSessionRepository sessionRepository,
                               SessionBlockRepository blockRepository,
                               GroupRepository groupRepository) {
        this.sessionRepository = sessionRepository;
        this.blockRepository = blockRepository;
        this.groupRepository = groupRepository;
    }

    @PostMapping("/import")
    @Transactional
    public ResponseEntity<BatchImportResponse> importTraining(@RequestBody BatchImportRequest request) {

        List<Group> groups = new ArrayList<>();
        for (Long groupId : request.getGroupIds()) {
            Group group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado: " + groupId));
            groups.add(group);
        }

        DayOfWeek targetDay = parseDayOfWeek(request.getDayOfWeek());
        List<LocalDate> dates = getAllDatesForDayInMonth(request.getYear(), request.getMonth(), targetDay);

        List<Long> sessionIds = new ArrayList<>();
        int totalBlocks = 0;

        for (Group group : groups) {
            for (int weekIndex = 0; weekIndex < dates.size(); weekIndex++) {
                LocalDate sessionDate = dates.get(weekIndex);
                boolean isDescargaWeek = (weekIndex == 3);

                TrainingSession session = new TrainingSession();
                session.setDate(sessionDate);
                session.setTitle(buildTitle(request.getDayOfWeek(), weekIndex + 1, isDescargaWeek));
                session.setDescription("Importado desde Telegram vía n8n");
                session.setGroup(group);
                session.setCoachId(request.getCoachId());

                TrainingSession saved = sessionRepository.save(session);
                sessionIds.add(saved.getId());

                if (request.getBlocks() != null) {
                    for (BatchImportRequest.BlockData bd : request.getBlocks()) {
                        if (isDescargaWeek && bd.isSkipOnDescarga()) continue;

                        SessionBlock block = new SessionBlock();
                        block.setSession(saved);
                        block.setBlockOrder(bd.getBlockOrder());
                        block.setBlockType(bd.getBlockType());
                        block.setTarget(bd.getTarget());
                        block.setTitle(bd.getTitle());

                        if (isDescargaWeek && bd.getDescriptionDescarga() != null) {
                            block.setDescription(bd.getDescriptionDescarga());
                        } else {
                            block.setDescription(bd.getDescription());
                        }

                        blockRepository.save(block);
                        totalBlocks++;
                    }
                }
            }
        }

        String summary = String.format("%s - %d sesiones creadas en %d grupos para %d/%d con %d bloques",
                request.getDayOfWeek(), sessionIds.size(), groups.size(),
                request.getMonth(), request.getYear(), totalBlocks);

        return ResponseEntity.ok(new BatchImportResponse(sessionIds.size(), totalBlocks, sessionIds, summary));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "n8n-import"));
    }

    private DayOfWeek parseDayOfWeek(String day) {
        return switch (day.toUpperCase().trim()) {
            case "LUNES"                    -> DayOfWeek.MONDAY;
            case "MARTES"                   -> DayOfWeek.TUESDAY;
            case "MIÉRCOLES", "MIERCOLES"   -> DayOfWeek.WEDNESDAY;
            case "JUEVES"                   -> DayOfWeek.THURSDAY;
            case "VIERNES"                  -> DayOfWeek.FRIDAY;
            case "SÁBADO", "SABADO"         -> DayOfWeek.SATURDAY;
            case "DOMINGO"                  -> DayOfWeek.SUNDAY;
            default -> throw new IllegalArgumentException("Día no reconocido: " + day);
        };
    }

    private List<LocalDate> getAllDatesForDayInMonth(int year, int month, DayOfWeek targetDay) {
        List<LocalDate> dates = new ArrayList<>();
        YearMonth ym = YearMonth.of(year, month);
        LocalDate first = ym.atDay(1).with(TemporalAdjusters.firstInMonth(targetDay));
        LocalDate current = first;
        while (current.getMonth() == ym.getMonth()) {
            dates.add(current);
            current = current.plusWeeks(1);
        }
        return dates;
    }

    private String buildTitle(String dayOfWeek, int weekNumber, boolean isDescarga) {
        String base = dayOfWeek.substring(0, 1).toUpperCase() + dayOfWeek.substring(1).toLowerCase();
        if (isDescarga) return base + " - Semana " + weekNumber + " (Descarga)";
        return base + " - Semana " + weekNumber;
    }

    @GetMapping("/groups")
    public ResponseEntity<List<Group>> getGroups() {
        return ResponseEntity.ok(groupRepository.findAll());
    }
}