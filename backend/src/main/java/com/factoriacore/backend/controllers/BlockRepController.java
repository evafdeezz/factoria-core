package com.factoriacore.backend.controllers;

import com.factoriacore.backend.models.BlockRep;
import com.factoriacore.backend.models.SessionBlock;
import com.factoriacore.backend.repositories.BlockRepRepository;
import com.factoriacore.backend.repositories.SessionBlockRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/block-reps")
public class BlockRepController {

    private final BlockRepRepository repository;
    private final SessionBlockRepository sessionBlockRepository;

    public BlockRepController(BlockRepRepository repository,
                              SessionBlockRepository sessionBlockRepository) {
        this.repository = repository;
        this.sessionBlockRepository = sessionBlockRepository;
    }

    @GetMapping
    public List<BlockRep> getAll() {
        return repository.findAll();
    }

    @GetMapping("/by-block/{blockId}")
    public List<BlockRep> getByBlock(@PathVariable Long blockId) {
        return repository.findByBlock_IdOrderByRepOrderAsc(blockId);
    }

    @PostMapping
    public BlockRep create(@RequestBody BlockRep request) {
        if (request.getBlock() == null || request.getBlock().getId() == null) {
            throw new IllegalArgumentException("block.id es obligatorio");
        }
        SessionBlock block = sessionBlockRepository.findById(request.getBlock().getId())
                .orElseThrow(() -> new RuntimeException("SessionBlock not found"));
        request.setBlock(block);
        return repository.save(request);
    }

    @PutMapping("/{id}")
    public BlockRep update(@PathVariable Long id, @RequestBody BlockRep incoming) {
        BlockRep existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("BlockRep not found"));
        existing.setRepOrder(incoming.getRepOrder());
        existing.setValue(incoming.getValue());
        existing.setUnit(incoming.getUnit());
        existing.setNotes(incoming.getNotes());
        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}