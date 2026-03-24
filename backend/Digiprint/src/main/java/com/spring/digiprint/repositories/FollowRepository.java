package com.spring.digiprint.repositories;

import com.spring.digiprint.entities.Follow;
import com.spring.digiprint.entities.FollowId;
import com.spring.digiprint.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, FollowId> {

    long countByArtist_UserId(Integer artistUserId);

    boolean existsByUserAndArtist(User user, User artist);

    List<Follow> findByUser(User user);

    List<Follow> findByArtist(User artist);
}

