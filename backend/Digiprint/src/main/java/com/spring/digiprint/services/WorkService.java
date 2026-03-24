package com.spring.digiprint.services;

import com.spring.digiprint.dtos.requests.*;
import com.spring.digiprint.dtos.responses.*;
import com.spring.digiprint.enums.Genre;
import com.spring.digiprint.enums.Rating;
import java.util.List;
import java.time.LocalDate;

public interface WorkService {
    WorkResponse getWorkById(Integer id);

    WorkResponse addWork(AddWorkRequest request);

    WorkResponse updateWork(Integer id, UpdateWorkRequest request);

    void deleteWork(Integer id);

    PageResponse<WorkPreviewResponse> filterWorks(
            Genre genre,
            String artistName,
            LocalDate startDate,
            LocalDate endDate,
            List<String> tags,
            List<Rating> ratings,
            String sort,
            int page,
            int size
    );
}
