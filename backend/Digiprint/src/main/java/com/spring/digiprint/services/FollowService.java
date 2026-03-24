package com.spring.digiprint.services;

import com.spring.digiprint.dtos.responses.FollowResponse;

import java.util.List;

public interface FollowService {

    void follow(Integer artistId);

    void unfollow(Integer artistId);

    List<FollowResponse> getFollowing();

    List<FollowResponse> getFollowers(Integer artistId);
}

