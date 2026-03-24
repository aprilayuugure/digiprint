package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.responses.LikeResponse;
import com.spring.digiprint.entities.*;
import com.spring.digiprint.repositories.*;
import com.spring.digiprint.services.LikeService;
import com.spring.digiprint.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RequiredArgsConstructor
@Service
@Transactional
public class LikeServiceImpl implements LikeService {
    private final LikeRepository likeRepo;
    private final WorkRepository workRepo;
    private final UserRepository userRepo;

    @Override
    public void like(Integer workId) {
        Integer accountId = SecurityUtil.getCurrentUserId();

        User u = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Work w = workRepo.findById(workId)
                .orElseThrow(() -> new RuntimeException("Work not found"));

        Integer userId = u.getUserId();

        if (!likeRepo.existsByUser_UserIdAndWork_WorkId(userId, workId)) {
            Like l = new Like(new LikeId(userId, workId), u, w);
            likeRepo.save(l);

            workRepo.incrementLikeCount(workId);
        }
    }

    @Override
    public void unlike(Integer workId) {
        Integer accountId = SecurityUtil.getCurrentUserId();

        User u = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Integer userId = u.getUserId();
        if (likeRepo.existsByUser_UserIdAndWork_WorkId(userId, workId)) {
            likeRepo.deleteByUser_UserIdAndWork_WorkId(userId, workId);
            workRepo.decrementLikeCount(workId);
        }
    }

    @Override
    public List<LikeResponse> getLikesByWorkId(Integer workId) {
        return likeRepo.findUsersByWorkId(workId)
                .stream()
                .map(LikeResponse::new)
                .toList();
    }

    @Override
    public boolean isLiked(Integer workId) {
        Integer accountId = SecurityUtil.getCurrentUserId();
        User u = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return likeRepo.existsByUser_UserIdAndWork_WorkId(u.getUserId(), workId);
    }

}
