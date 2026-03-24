package com.spring.digiprint.services;

import com.spring.digiprint.dtos.responses.LikeResponse;

import java.util.List;

public interface LikeService {
    public void like(Integer workId);

    public void unlike(Integer workId);

    public boolean isLiked(Integer workId);

    public List<LikeResponse> getLikesByWorkId(Integer workId);
}
