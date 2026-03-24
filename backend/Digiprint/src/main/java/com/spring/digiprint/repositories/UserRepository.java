package com.spring.digiprint.repositories;

import com.spring.digiprint.entities.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    @EntityGraph(attributePaths = {"account"})
    @Override
    Optional<User> findById(Integer id);

    @EntityGraph(attributePaths = {"account"})
    Optional<User> findByAccount_AccountId(Integer id);

    /**
     * Match usernames for suggestions — no filter on {@link com.spring.digiprint.enums.Role}.
     */
    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<User> findUsersByUsernameContainingIgnoreCase(@Param("q") String q, Pageable pageable);

    @EntityGraph(attributePaths = {"account"})
    Optional<User> findByUsername(String username);
}
