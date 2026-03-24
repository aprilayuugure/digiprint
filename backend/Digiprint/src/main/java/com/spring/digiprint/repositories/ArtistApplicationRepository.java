package com.spring.digiprint.repositories;

import com.spring.digiprint.entities.ArtistApplication;
import com.spring.digiprint.enums.ArtistApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArtistApplicationRepository extends JpaRepository<ArtistApplication, Integer> {

    boolean existsByAccount_AccountIdAndStatus(Integer accountId, ArtistApplicationStatus status);

    List<ArtistApplication> findAllByOrderByRequestedAtDesc();

    List<ArtistApplication> findByStatusOrderByRequestedAtDesc(ArtistApplicationStatus status);

    Optional<ArtistApplication> findFirstByAccount_AccountIdOrderByRequestedAtDesc(Integer accountId);

    long countByStatus(ArtistApplicationStatus status);
}
