package com.factoriacore.backend.controllers;

import com.factoriacore.backend.dto.BatchImportRequest;
import com.factoriacore.backend.dto.BatchImportResponse;
import com.factoriacore.backend.models.Group;
import com.factoriacore.backend.models.SessionBlock;
import com.factoriacore.backend.models.TrainingSession;
import com.factoriacore.backend.models.enums.SessionStatus;
import com.factoriacore.backend.models.enums.TrainingSource;
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

/**
 * Endpoint dedicado para la importación automática desde n8n.
 *
 * Flujo:
 * 1. n8n recibe una foto de entrenamiento vía Telegram
 * 2. Claude Vision extrae el contenido como JSON
 * 3. n8n transforma el JSON y llama a POST /api/n8n/import
 * 4. Este controller crea las TrainingSessions (una por semana del mes)
 *    y sus SessionBlocks correspondientes
 *
 * Seguridad: protegido por ApiKeyFilter (header X-API-Key)
 */
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

    /**
     * Importa un día de entrenamiento completo.
     * Recibe el día de la semana + mes/año + bloques extraídos de la foto.
     * Crea automáticamente una sesión por cada semana del mes para ese día.
     *
     * Ejemplo: si dayOfWeek = "JUEVES", month = 5, year = 2025
     * → crea sesiones para 01/05, 08/05, 15/05, 22/05, 29/05
     */
    @PostMapping("/import")
    @Transactional
    public ResponseEntity<BatchImportResponse> importTraining(@RequestBody BatchImportRequest request) {

        // 1. Validar grupo
        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Grupo no encontrado con id: " + request.getGroupId()));

        // 2. Resolver día de la semana
        DayOfWeek targetDay = parseDayOfWeek(request.getDayOfWeek());

        // 3. Calcular todas las fechas de ese día en el mes
        List<LocalDate> dates = getAllDatesForDayInMonth(
                request.getYear(), request.getMonth(), targetDay);

        // 4. Crear sesiones y bloques
        List<Long> sessionIds = new ArrayList<>();
        int totalBlocks = 0;

        for (int weekIndex = 0; weekIndex < dates.size(); weekIndex++) {
            LocalDate sessionDate = dates.get(weekIndex);
            boolean isDescargaWeek = (weekIndex == 3); // semana 4 = descarga

            // Crear la sesión
            TrainingSession session = new TrainingSession();
            session.setDate(sessionDate);
            session.setTitle(buildTitle(request.getDayOfWeek(), weekIndex + 1, isDescargaWeek));
            session.setDescription("Importado desde Telegram vía n8n");
            session.setGroup(group);
            session.setCoachId(request.getCoachId());
            session.setSource(TrainingSource.N8N_IMPORT);
            session.setStatus(SessionStatus.PLANNED);
            session.setRawText(request.getRawText());

            TrainingSession saved = sessionRepository.save(session);
            sessionIds.add(saved.getId());

            // Crear los bloques
            if (request.getBlocks() != null) {
                for (BatchImportRequest.BlockData bd : request.getBlocks()) {

                    // Si el bloque se salta en semana de descarga, no crearlo
                    if (isDescargaWeek && bd.isSkipOnDescarga()) {
                        continue;
                    }

                    SessionBlock block = new SessionBlock();
                    block.setSession(saved);
                    block.setBlockOrder(bd.getBlockOrder());
                    block.setBlockType(bd.getBlockType());
                    block.setTarget(bd.getTarget());
                    block.setTitle(bd.getTitle());

                    // Usar descripción alternativa en semana de descarga si existe
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

        // 5. Respuesta
        String summary = String.format(
                "%s - %d sesiones creadas (%s %d/%d) con %d bloques en total",
                request.getDayOfWeek(),
                dates.size(),
                group.getName(),
                request.getMonth(),
                request.getYear(),
                totalBlocks
        );

        BatchImportResponse response = new BatchImportResponse(
                dates.size(), totalBlocks, sessionIds, summary);

        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint para verificar que la conexión n8n → backend funciona.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "service", "n8n-import"
        ));
    }

    // =========================================================================
    // Métodos privados
    // =========================================================================

    private DayOfWeek parseDayOfWeek(String day) {
        return switch (day.toUpperCase().trim()) {
            case "LUNES"     -> DayOfWeek.MONDAY;
            case "MARTES"    -> DayOfWeek.TUESDAY;
            case "MIÉRCOLES", "MIERCOLES" -> DayOfWeek.WEDNESDAY;
            case "JUEVES"    -> DayOfWeek.THURSDAY;
            case "VIERNES"   -> DayOfWeek.FRIDAY;
            case "SÁBADO", "SABADO" -> DayOfWeek.SATURDAY;
            case "DOMINGO"   -> DayOfWeek.SUNDAY;
            default -> throw new IllegalArgumentException("Día no reconocido: " + day);
        };
    }

    private List<LocalDate> getAllDatesForDayInMonth(int year, int month, DayOfWeek targetDay) {
        List<LocalDate> dates = new ArrayList<>();
        YearMonth ym = YearMonth.of(year, month);

        // Primer día del mes que sea el targetDay
        LocalDate first = ym.atDay(1).with(TemporalAdjusters.firstInMonth(targetDay));

        LocalDate current = first;
        while (current.getMonth() == ym.getMonth()) {
            dates.add(current);
            current = current.plusWeeks(1);
        }

        return dates;
    }

    private String buildTitle(String dayOfWeek, int weekNumber, boolean isDescarga) {
        String base = dayOfWeek.substring(0, 1).toUpperCase()
                + dayOfWeek.substring(1).toLowerCase();
        if (isDescarga) {
            return base + " - Semana " + weekNumber + " (Descarga)";
        }
        return base + " - Semana " + weekNumber;
    }
}