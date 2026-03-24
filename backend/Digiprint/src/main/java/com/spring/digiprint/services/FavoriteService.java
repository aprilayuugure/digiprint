package com.spring.digiprint.services;

import com.spring.digiprint.dtos.responses.PageResponse;
import com.spring.digiprint.dtos.responses.WorkPreviewResponse;

public interface FavoriteService {

    void addFavorite(Integer workId);

    void removeFavorite(Integer workId);

    boolean isFavorited(Integer workId);

    PageResponse<WorkPreviewResponse> getMyFavoriteWorks(int page, int size);
}
