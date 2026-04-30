package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.MenstrualCycle;
import com.factoriacore.backend.models.MenstrualEntry;
import com.factoriacore.backend.models.enums.UserRole;
import com.factoriacore.backend.repositories.AthleteProfileRepository;
import com.factoriacore.backend.repositories.GroupMemberRepository;
import com.factoriacore.backend.repositories.MenstrualCycleRepository;
import com.factoriacore.backend.repositories.MenstrualEntryRepository;
import com.factoriacore.backend.security.AppUserDetails;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/menstrual/{athleteId}/cycles/{cycleId}/entries")
public class MenstrualEntryController {

    private final MenstrualEntryRepository entryRepository;
    private final MenstrualCycleRepository cycleRepository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final GroupMemberRepository groupMemberRepository;

    public MenstrualEntryController(MenstrualEntryRepository entryRepository,
                                    MenstrualCycleRepository cycleRepository,
                                    AthleteProfileRepository athleteProfileRepository,
                                    GroupMemberRepository groupMemberRepository) {
        this.entryRepository = entryRepository;
        this.cycleRepository = cycleRepository;
        this.athleteProfileRepository = athleteProfileRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    private MenstrualCycle resolveAndCheckAccess(Long athleteId, Long cycleId,
                                                 AppUserDetails currentUser,
                                                 boolean requireOwner) {
        if (currentUser == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "NOT_AUTHENTICATED");

        var profile = athleteProfileRepository.findById(athleteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ATHLETE_NOT_FOUND"));

        MenstrualCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CYCLE_NOT_FOUND"));

        if (!cycle.getAthlete().getId().equals(athleteId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "CYCLE_NOT_FOUND");

        boolean isOwner = profile.getUser().getId().equals(currentUser.getUser().getId());

        if (requireOwner && !isOwner)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ACCESS_DENIED");

        if (!isOwner) {
            boolean isCoachWithAccess = currentUser.getUser().getRole() == UserRole.COACH
                    && profile.isShareMenstrualDataWithCoach()
                    && groupMemberRepository.existsByAthlete_IdAndGroup_CoachId(
                    athleteId, currentUser.getUser().getId());
            if (!isCoachWithAccess)
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ACCESS_DENIED");
        }

        return cycle;
    }

    /** GET — todas las entradas de un ciclo */
    @GetMapping
    public List<MenstrualEntry> getAll(@PathVariable Long athleteId,
                                       @PathVariable Long cycleId,
                                       @AuthenticationPrincipal AppUserDetails currentUser) {
        resolveAndCheckAccess(athleteId, cycleId, currentUser, false);
        return entryRepository.findByCycle_IdOrderByDateAsc(cycleId);
    }

    /** POST — crea o actualiza la entrada de un día (upsert por fecha) */
    @PostMapping
    public ResponseEntity<MenstrualEntry> save(@PathVariable Long athleteId,
                                               @PathVariable Long cycleId,
                                               @RequestBody MenstrualEntry incoming,
                                               @AuthenticationPrincipal AppUserDetails currentUser) {
        MenstrualCycle cycle = resolveAndCheckAccess(athleteId, cycleId, currentUser, true);

        LocalDate targetDate = incoming.getDate() != null ? incoming.getDate() : LocalDate.now();

        MenstrualEntry entry = entryRepository
                .findByCycle_IdAndDate(cycleId, targetDate)
                .orElseGet(MenstrualEntry::new);

        entry.setCycle(cycle);
        entry.setDate(targetDate);
        if (incoming.getCycleDay() != null)       entry.setCycleDay(incoming.getCycleDay());
        if (incoming.getEstimatedPhase() != null) entry.setEstimatedPhase(incoming.getEstimatedPhase());
        if (incoming.getPainLevel() != null)      entry.setPainLevel(incoming.getPainLevel());
        if (incoming.getFatigueLevel() != null)   entry.setFatigueLevel(incoming.getFatigueLevel());
        if (incoming.getFlowLevel() != null)      entry.setFlowLevel(incoming.getFlowLevel());
        if (incoming.getMood() != null)           entry.setMood(incoming.getMood());
        if (incoming.getNotes() != null)          entry.setNotes(incoming.getNotes());

        return ResponseEntity.status(HttpStatus.CREATED).body(entryRepository.save(entry));
    }

    /** DELETE — elimina una entrada */
    @DeleteMapping("/{entryId}")
    public ResponseEntity<Void> delete(@PathVariable Long athleteId,
                                       @PathVariable Long cycleId,
                                       @PathVariable Long entryId,
                                       @AuthenticationPrincipal AppUserDetails currentUser) {
        resolveAndCheckAccess(athleteId, cycleId, currentUser, true);
        entryRepository.findById(entryId).ifPresent(e -> {
            if (!e.getCycle().getId().equals(cycleId))
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "ENTRY_NOT_FOUND");
            entryRepository.deleteById(entryId);
        });
        return ResponseEntity.noContent().build();
    }
}