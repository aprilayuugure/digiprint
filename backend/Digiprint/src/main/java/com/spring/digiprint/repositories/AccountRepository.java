package com.spring.digiprint.repositories;

import com.spring.digiprint.entities.*;
import com.spring.digiprint.enums.Role;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;


@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {
    Optional<Account> findByEmailOrUserUsername(String email, String username);

    long countByRole(Role role);
}
