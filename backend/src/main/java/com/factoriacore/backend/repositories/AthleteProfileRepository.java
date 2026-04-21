package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.AthleteProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AthleteProfileRepository extends JpaRepository<AthleteProfile, Long>
{
    Optional<AthleteProfile> findByUserId(Long userId);
}