package com.spring.digiprint.services;

import com.spring.digiprint.dtos.requests.CommissionRequest;
import com.spring.digiprint.dtos.responses.CommissionResponse;
import com.spring.digiprint.enums.Genre;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface CommissionService {

    CommissionResponse getCommissionById(Integer id);

    List<CommissionResponse> getCommissionsByUser(Integer userId);

    List<CommissionResponse> getCommissionsByGenre(Genre genre);

    CommissionResponse addCommission(CommissionRequest request);

    /** Lưu file vào {@code /storage/commissions/{commissionId}/} và thêm bản ghi {@link com.spring.digiprint.entities.Sample}. */
    String uploadCommissionAttachment(Integer commissionId, MultipartFile file, Genre genre) throws IOException;

    CommissionResponse updateCommission(Integer id, CommissionRequest request);

    void deleteCommission(Integer id);
}

