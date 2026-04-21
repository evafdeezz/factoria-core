package com.factoriacore.backend.repositories;

import com.factoriacore.backend.models.User;
import com.factoriacore.backend.models.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>
{
    Optional<User> findByEmail(String email);
    List<User> findByRole(UserRole role);
}