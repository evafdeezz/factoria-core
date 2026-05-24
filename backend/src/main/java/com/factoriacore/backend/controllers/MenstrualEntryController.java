package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.MenstrualCycle;
import com.factoriacore.backend.models.MenstrualEntry;
import com.factoriacore.backend.models.User;
import com.factoriacore.backend.models.enums.MenstrualPhase;
import com.factoriacore.backend.models.enums.UserRole;
import com.factoriacore.backend.repositories.AthleteProfileRepository;
import com.factoriacore.backend.repositories.GroupMemberRepository;
import com.factoriacore.backend.repositories.MenstrualCycleRepository;
import com.factoriacore.backend.repositories.MenstrualEntryRepository;
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


@RestController
@RequestMapping("/api/menstrual/{athleteId}/cycles/{cycleId}/entries")
public class MenstrualEntryController {

    private final MenstrualEntryRepository entryRepository;
    private final MenstrualCycleRepository cycleRepository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    public MenstrualEntryController(MenstrualEntryRepository entryRepository,
                                    MenstrualCycleRepository cycleRepository,
                                    AthleteProfileRepository athleteProfileRepository,
                                    GroupMemberRepository groupMemberRepository,
                                    UserRepository userRepository) {
        this.entryRepository = entryRepository;
        this.cycleRepository = cycleRepository;
        this.athleteProfileRepository = athleteProfileRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
    }

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

    private MenstrualCycle resolveAndCheckAccess(Long athleteId,
                                                 Long cycleId,
                                                 User currentUser,
                                                 boolean requireOwner) {

        var profile = athleteProfileRepository.findById(athleteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ATHLETE_NOT_FOUND"));

        MenstrualCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CYCLE_NOT_FOUND"));

        if (!cycle.getAthlete().getId().equals(athleteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CYCLE_NOT_FOUND");
        }

        boolean isOwner = profile.getUser().getId().equals(currentUser.getId());

        if (requireOwner && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ACCESS_DENIED");
        }

        if (!isOwner) {
            boolean isCoachWithAccess = currentUser.getRole() == UserRole.COACH
                    && profile.isShareMenstrualDataWithCoach()
                    && groupMemberRepository.existsByAthlete_IdAndGroup_CoachId(
                    athleteId, currentUser.getId()
            );

            if (!isCoachWithAccess) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ACCESS_DENIED");
            }
        }

        return cycle;
    }

    private int calculateCycleDay(MenstrualCycle cycle, LocalDate targetDate) {
        if (cycle.getStartDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CYCLE_START_DATE_NOT_FOUND");
        }

        int cycleDay = (int) ChronoUnit.DAYS.between(cycle.getStartDate(), targetDate) + 1;

        if (cycleDay < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ENTRY_DATE_BEFORE_CYCLE_START");
        }

        return cycleDay;
    }

    private MenstrualPhase calculateEstimatedPhase(int cycleDay, MenstrualCycle cycle) {
        int bleedingDays = cycle.getBleedingDays() != null && cycle.getBleedingDays() > 0
                ? cycle.getBleedingDays()
                : 5;

        int cycleLength = cycle.getCycleLength() != null && cycle.getCycleLength() > 0
                ? cycle.getCycleLength()
                : 28;

        int ovulationDay = Math.max(1, cycleLength - 14);
        int ovulationStart = Math.max(bleedingDays + 1, ovulationDay - 1);
        int ovulationEnd = ovulationDay + 1;

        if (cycleDay <= bleedingDays) {
            return MenstrualPhase.MENSTRUAL;
        }

        if (cycleDay < ovulationStart) {
            return MenstrualPhase.FOLLICULAR;
        }

        if (cycleDay <= ovulationEnd) {
            return MenstrualPhase.OVULATORY;
        }

        return MenstrualPhase.LUTEAL;
    }

    /**
     * GET — obtiene todas las entradas guardadas de un ciclo.
     *
     * Se usa para mostrar en el frontend los registros diarios del ciclo menstrual.
     * No crea ni modifica información, solo consulta los datos existentes.
     */
    @GetMapping
    public List<MenstrualEntry> getAll(@PathVariable Long athleteId,
                                       @PathVariable Long cycleId,
                                       Authentication authentication) {

        User currentUser = getCurrentUser(authentication);
        resolveAndCheckAccess(athleteId, cycleId, currentUser, false);

        return entryRepository.findByCycle_IdOrderByDateAsc(cycleId);
    }

    /**
     * POST — crea una entrada diaria o actualiza la que ya exista para esa fecha.
     *
     * El frontend envía los datos del día y el backend calcula automáticamente
     * el día del ciclo y la fase menstrual estimada antes de guardar.
     */
    @PostMapping
    public ResponseEntity<MenstrualEntry> save(@PathVariable Long athleteId,
                                               @PathVariable Long cycleId,
                                               @RequestBody MenstrualEntry incoming,
                                               Authentication authentication) {

        User currentUser = getCurrentUser(authentication);
        MenstrualCycle cycle = resolveAndCheckAccess(athleteId, cycleId, currentUser, true);

        LocalDate targetDate = incoming.getDate() != null ? incoming.getDate() : LocalDate.now();

        int cycleDay = calculateCycleDay(cycle, targetDate);
        MenstrualPhase estimatedPhase = calculateEstimatedPhase(cycleDay, cycle);

        MenstrualEntry entry = entryRepository
                .findByCycle_IdAndDate(cycleId, targetDate)
                .orElseGet(MenstrualEntry::new);

        entry.setCycle(cycle);
        entry.setDate(targetDate);

        // Estos valores se calculan en el backend para no depender del frontend
        entry.setCycleDay(cycleDay);
        entry.setEstimatedPhase(estimatedPhase);

        if (incoming.getPainLevel() != null) {
            entry.setPainLevel(incoming.getPainLevel());
        }

        if (incoming.getFatigueLevel() != null) {
            entry.setFatigueLevel(incoming.getFatigueLevel());
        }

        if (incoming.getFlowLevel() != null) {
            entry.setFlowLevel(incoming.getFlowLevel());
        }

        if (incoming.getMood() != null) {
            entry.setMood(incoming.getMood());
        }

        if (incoming.getNotes() != null) {
            entry.setNotes(incoming.getNotes());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(entryRepository.save(entry));
    }

    /**
     * DELETE — elimina una entrada concreta del ciclo.
     *
     * Antes de borrar, se comprueba que el usuario tenga permisos y que la entrada
     * pertenezca realmente al ciclo indicado en la URL.
     */
    @DeleteMapping("/{entryId}")
    public ResponseEntity<Void> delete(@PathVariable Long athleteId,
                                       @PathVariable Long cycleId,
                                       @PathVariable Long entryId,
                                       Authentication authentication) {

        User currentUser = getCurrentUser(authentication);
        resolveAndCheckAccess(athleteId, cycleId, currentUser, true);

        MenstrualEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ENTRY_NOT_FOUND"));

        if (!entry.getCycle().getId().equals(cycleId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "ENTRY_NOT_FOUND");
        }

        entryRepository.deleteById(entryId);

        return ResponseEntity.noContent().build();
    }
}