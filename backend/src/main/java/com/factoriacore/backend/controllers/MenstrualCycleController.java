package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.AthleteProfile;
import com.factoriacore.backend.models.MenstrualCycle;
import com.factoriacore.backend.models.User;
import com.factoriacore.backend.models.enums.MenstrualPhase;
import com.factoriacore.backend.models.enums.UserRole;
import com.factoriacore.backend.repositories.AthleteProfileRepository;
import com.factoriacore.backend.repositories.GroupMemberRepository;
import com.factoriacore.backend.repositories.MenstrualCycleRepository;
import com.factoriacore.backend.repositories.UserRepository;
import com.factoriacore.backend.security.AppUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/menstrual")
public class MenstrualCycleController {

    private final AthleteProfileRepository athleteProfileRepository;
    private final MenstrualCycleRepository menstrualCycleRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    public MenstrualCycleController(AthleteProfileRepository athleteProfileRepository,
                                    MenstrualCycleRepository menstrualCycleRepository,
                                    GroupMemberRepository groupMemberRepository,
                                    UserRepository userRepository) {
        this.athleteProfileRepository = athleteProfileRepository;
        this.menstrualCycleRepository = menstrualCycleRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
    }

    // ── Autenticación y autorización ────────────────────────────────────────────

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "NOT_AUTHENTICATED");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof AppUserDetails appUserDetails) {
            return appUserDetails.getUser();
        }

        if (principal instanceof OAuth2User oauth2User) {
            String email = oauth2User.getAttribute("email");

            if (email == null || email.isBlank()) {
                email = oauth2User.getName();
            }

            if (email == null || email.isBlank()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "EMAIL_NOT_AVAILABLE");
            }

            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND"));
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_AUTHENTICATION");
    }

    private void checkAccess(User currentUser, AthleteProfile profile) {
        boolean isOwner = profile.getUser().getId().equals(currentUser.getId());
        if (isOwner) return;

        boolean isCoachWithAccess = currentUser.getRole() == UserRole.COACH
                && profile.isShareMenstrualDataWithCoach()
                && groupMemberRepository.existsByAthlete_IdAndGroup_CoachId(
                profile.getId(), currentUser.getId());

        if (!isCoachWithAccess) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ACCESS_DENIED");
        }
    }

    // ── DTOs ────────────────────────────────────────────────────────────────────

    public static class CycleStatusDto {
        public Long cycleId;
        public int cycleDay;
        public int daysOverdue;
        public boolean isLate;
        public String phase;
        public String phaseLabel;
        public String summary;
        public String training;
        public String warning;
        public String emoji;
        public int totalCycleLength;
        public String lastPeriodDate;
    }

    public static class RegisterPeriodRequest {
        private String startDate;

        public String getStartDate() {
            return startDate;
        }

        public void setStartDate(String startDate) {
            this.startDate = startDate;
        }
    }

    // ── Endpoints ───────────────────────────────────────────────────────────────

    @GetMapping("/{athleteId}/status")
    public ResponseEntity<?> getCycleStatus(@PathVariable Long athleteId,
                                            Authentication authentication) {

        User currentUser = getCurrentUser(authentication);

        AthleteProfile profile = athleteProfileRepository.findById(athleteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ATHLETE_NOT_FOUND"));

        checkAccess(currentUser, profile);

        if (!profile.isMenstrualTrackingEnabled() || profile.getLastPeriodDate() == null) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }

        LocalDate today = LocalDate.now();
        LocalDate lastPeriod = profile.getLastPeriodDate();
        int cycleLength = profile.getCycleLength() != null ? profile.getCycleLength() : 28;
        int menstrualDuration = profile.getMenstrualDuration() != null ? profile.getMenstrualDuration() : 5;
        long daysSince = ChronoUnit.DAYS.between(lastPeriod, today);
        int cycleDay = (int) daysSince + 1;

        CycleStatusDto dto = new CycleStatusDto();
        dto.totalCycleLength = cycleLength;
        dto.lastPeriodDate = lastPeriod.toString();

        menstrualCycleRepository
                .findByAthlete_IdOrderByStartDateDesc(athleteId)
                .stream()
                .findFirst()
                .ifPresent(c -> dto.cycleId = c.getId());

        if (daysSince >= cycleLength) {
            int daysOverdue = (int) daysSince - cycleLength + 1;
            dto.cycleDay = cycleDay;
            dto.daysOverdue = daysOverdue;
            dto.isLate = true;
            dto.phase = null;
            dto.emoji = "🟠";
            dto.phaseLabel = daysOverdue == 0 ? "Posible llegada hoy" : "Período pendiente de registrar";
            dto.summary = daysOverdue <= 3
                    ? "Según tu ciclo habitual, tu período podría llegar en cualquier momento. Es normal que haya variaciones de unos días. Cuando te baje, recuerda registrarlo para mantener el seguimiento actualizado."
                    : "Tu ciclo lleva " + daysOverdue + " días más de lo habitual. Los ciclos pueden alargarse por estrés, carga de entrenamiento elevada u otros factores. Si tienes dudas, consulta con tu médico.";
            dto.training = "En esta fase de incertidumbre, escucha a tu cuerpo. Si notas los síntomas previos habituales, ajusta la carga como en fase lútea tardía: prioriza técnica, movilidad y evita los tests de máxima intensidad.";
            dto.warning = "Cuando empiece tu período, registra la fecha para que el seguimiento vuelva a ser preciso.";
        } else {
            dto.cycleDay = cycleDay;
            dto.daysOverdue = 0;
            dto.isLate = false;
            buildPhaseInfo(dto, calculatePhase(cycleDay, menstrualDuration, cycleLength));
        }

        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{athleteId}/register")
    public ResponseEntity<?> registerPeriod(@PathVariable Long athleteId,
                                            @RequestBody(required = false) RegisterPeriodRequest body,
                                            Authentication authentication) {

        User currentUser = getCurrentUser(authentication);

        AthleteProfile profile = athleteProfileRepository.findById(athleteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ATHLETE_NOT_FOUND"));

        if (!profile.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ACCESS_DENIED");
        }

        LocalDate startDate = LocalDate.now();

        if (body != null && body.getStartDate() != null && !body.getStartDate().isBlank()) {
            startDate = LocalDate.parse(body.getStartDate());
        }

        MenstrualCycle cycle = new MenstrualCycle();
        cycle.setAthlete(profile);
        cycle.setStartDate(startDate);
        cycle.setCycleLength(profile.getCycleLength());
        cycle.setBleedingDays(profile.getMenstrualDuration());
        menstrualCycleRepository.save(cycle);

        profile.setLastPeriodDate(startDate);
        athleteProfileRepository.save(profile);

        return ResponseEntity.ok(Map.of(
                "message", "Período registrado correctamente",
                "startDate", startDate.toString(),
                "cycleId", cycle.getId()
        ));
    }

    @GetMapping("/{athleteId}/history")
    public List<MenstrualCycle> getCycleHistory(@PathVariable Long athleteId,
                                                Authentication authentication) {

        User currentUser = getCurrentUser(authentication);

        AthleteProfile profile = athleteProfileRepository.findById(athleteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ATHLETE_NOT_FOUND"));

        checkAccess(currentUser, profile);

        return menstrualCycleRepository.findByAthlete_IdOrderByStartDateDesc(athleteId);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private MenstrualPhase calculatePhase(int cycleDay, int menstrualDuration, int cycleLength) {
        if (cycleDay <= menstrualDuration) return MenstrualPhase.MENSTRUAL;
        if (cycleDay <= 13) return MenstrualPhase.FOLLICULAR;
        if (cycleDay <= 15) return MenstrualPhase.OVULATORY;
        return MenstrualPhase.LUTEAL;
    }

    private void buildPhaseInfo(CycleStatusDto dto, MenstrualPhase phase) {
        dto.phase = phase.name();

        switch (phase) {
            case MENSTRUAL -> {
                dto.phaseLabel = "Fase menstrual";
                dto.emoji = "🔴";
                dto.summary = "Estás en los primeros días del ciclo. Los niveles hormonales son bajos y es posible que notes más cansancio o molestias. Tu rendimiento en sprint puede mantenerse, pero el esfuerzo percibido será mayor.";
                dto.training = "Prioriza el trabajo técnico a intensidad moderada: salidas, frecuencia y técnica de carrera. Si hay dolor o molestias, reduce la carga explosiva y añade movilidad articular. Evita los tests de máxima intensidad estos días.";
                dto.warning = "Posibles calambres, fatiga o dolor lumbar. Si sientes molestias, ajusta la sesión sin forzar. Hidrátate más de lo habitual.";
            }
            case FOLLICULAR -> {
                dto.phaseLabel = "Fase folicular";
                dto.emoji = "🟡";
                dto.summary = "El estrógeno empieza a subir. Tu energía y tu capacidad de recuperación aumentan progresivamente. Es uno de los mejores momentos para adaptaciones de fuerza y velocidad.";
                dto.training = "Momento ideal para series al 90-95%, trabajo de aceleración y pliometría. Tu sistema nervioso responde mejor a los estímulos explosivos. Aprovecha para hacer los bloques de carga más intensos de la semana.";
                dto.warning = null;
            }
            case OVULATORY -> {
                dto.phaseLabel = "Fase ovulatoria";
                dto.emoji = "🟢";
                dto.summary = "Pico de estrógeno. Estás en tu mejor momento físico del ciclo: máxima fuerza, potencia y coordinación. Es el momento óptimo para competir o hacer tests de rendimiento.";
                dto.training = "Sesiones de velocidad a máxima intensidad (95-100%), salidas de tacos, series cortas con recuperación completa. Tu capacidad neuromuscular está al máximo. Si hay competición próxima, este es el momento de afinarte.";
                dto.warning = "⚠️ El aumento de estrógeno relaja los ligamentos. Mayor riesgo de lesión en tobillo y rodilla. Calienta bien, activa los estabilizadores y presta atención a la caída en ejercicios pliométricos.";
            }
            case LUTEAL -> {
                dto.phaseLabel = "Fase lútea";
                dto.emoji = "🔵";
                dto.summary = "La progesterona sube y los niveles de estrógeno bajan progresivamente. El esfuerzo percibido es mayor y la temperatura corporal ligeramente elevada. En los últimos días puedes notar más retención o irritabilidad.";
                dto.training = "Mantén la carga pero escucha al cuerpo. Las series largas y el trabajo de umbral se toleran bien en la primera mitad de esta fase. En los últimos días antes de la menstruación, reduce la intensidad explosiva y añade trabajo de recuperación activa, estiramientos y movilidad.";
                dto.warning = "La fatiga puede acumularse más rápido. Si notas que los tiempos suben o la sensación de esfuerzo es muy alta, no fuerces. La recuperación entre repeticiones puede necesitar más tiempo.";
            }
        }
    }
}