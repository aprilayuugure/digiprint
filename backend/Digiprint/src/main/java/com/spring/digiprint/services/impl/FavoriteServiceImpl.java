package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.responses.PageResponse;
import com.spring.digiprint.dtos.responses.WorkPreviewResponse;
import com.spring.digiprint.entities.*;
import com.spring.digiprint.repositories.FavoriteRepository;
import com.spring.digiprint.repositories.UserRepository;
import com.spring.digiprint.repositories.WorkRepository;
import com.spring.digiprint.services.FavoriteService;
import com.spring.digiprint.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Transactional
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepo;
    private final WorkRepository workRepo;
    private final UserRepository userRepo;

    @Override
    public void addFavorite(Integer workId) {
        Integer accountId = SecurityUtil.getCurrentUserId();

        User u = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Work w = workRepo.findById(workId)
                .orElseThrow(() -> new RuntimeException("Work not found"));

        Integer userId = u.getUserId();

        if (!favoriteRepo.existsByUser_UserIdAndWork_WorkId(userId, workId)) {
            Favorite f = new Favorite(new FavoriteId(userId, workId), u, w);
            favoriteRepo.save(f);
        }
    }

    @Override
    public void removeFavorite(Integer workId) {
        Integer accountId = SecurityUtil.getCurrentUserId();

        User u = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Integer userId = u.getUserId();
        if (favoriteRepo.existsByUser_UserIdAndWork_WorkId(userId, workId)) {
            favoriteRepo.deleteByUser_UserIdAndWork_WorkId(userId, workId);
        }
    }

    @Override
    public boolean isFavorited(Integer workId) {
        Integer accountId = SecurityUtil.getCurrentUserId();
        User u = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return favoriteRepo.existsByUser_UserIdAndWork_WorkId(u.getUserId(), workId);
    }

    @Override
    public PageResponse<WorkPreviewResponse> getMyFavoriteWorks(int page, int size) {
        Integer accountId = SecurityUtil.getCurrentUserId();
        User u = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new PageResponse<>(
                favoriteRepo.findFavoriteWorkPreviewsByUserId(u.getUserId(), PageRequest.of(page, size))
        );
    }
}
