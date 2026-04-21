package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.BlockRep;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BlockRepRepository extends JpaRepository<BlockRep, Long>
{
    List<BlockRep> findByBlock_IdOrderByRepOrderAsc(Long blockId);
}