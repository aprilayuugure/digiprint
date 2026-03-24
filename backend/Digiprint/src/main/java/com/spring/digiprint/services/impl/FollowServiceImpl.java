package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.responses.FollowResponse;
import com.spring.digiprint.entities.Follow;
import com.spring.digiprint.entities.FollowId;
import com.spring.digiprint.entities.User;
import com.spring.digiprint.repositories.FollowRepository;
import com.spring.digiprint.repositories.UserRepository;
import com.spring.digiprint.services.FollowService;
import com.spring.digiprint.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FollowServiceImpl implements FollowService {

    private final FollowRepository followRepo;
    private final UserRepository userRepo;

    @Override
    public void follow(Integer artistId) {
        Integer accountId = SecurityUtil.getCurrentUserId();

        User user = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User artist = userRepo.findById(artistId)
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        if (user.getUserId().equals(artist.getUserId())) {
            throw new RuntimeException("Cannot follow yourself");
        }

        if (!followRepo.existsByUserAndArtist(user, artist)) {
            Follow follow = new Follow(new FollowId(user.getUserId(), artist.getUserId()), user, artist);
            followRepo.save(follow);
        }
    }

    @Override
    public void unfollow(Integer artistId) {
        Integer accountId = SecurityUtil.getCurrentUserId();

        User user = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User artist = userRepo.findById(artistId)
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        followRepo.deleteById(new FollowId(user.getUserId(), artist.getUserId()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FollowResponse> getFollowing() {
        Integer accountId = SecurityUtil.getCurrentUserId();

        User user = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return followRepo.findByUser(user)
                .stream()
                .map(Follow::getArtist)
                .map(FollowResponse::new)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FollowResponse> getFollowers(Integer artistId) {
        User artist = userRepo.findById(artistId)
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        return followRepo.findByArtist(artist)
                .stream()
                .map(Follow::getUser)
                .map(FollowResponse::new)
                .toList();
    }
}

