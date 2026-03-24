package com.spring.digiprint.repositories;

import com.spring.digiprint.entities.Commission;
import com.spring.digiprint.enums.Genre;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommissionRepository extends JpaRepository<Commission, Integer> {

    @EntityGraph(attributePaths = {"attachments"})
    @Override
    Optional<Commission> findById(Integer id);

    @EntityGraph(attributePaths = {"attachments"})
    List<Commission> findByUser_UserId(Integer userId);

    @EntityGraph(attributePaths = {"attachments"})
    List<Commission> findByGenre(Genre genre);
}

