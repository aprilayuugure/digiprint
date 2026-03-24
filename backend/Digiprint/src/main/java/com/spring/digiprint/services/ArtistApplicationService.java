package com.spring.digiprint.services;

import com.spring.digiprint.dtos.requests.ApplyToArtistRequest;
import com.spring.digiprint.dtos.requests.UpdateArtistApplicationStatusRequest;
import com.spring.digiprint.dtos.responses.ArtistApplicationResponse;
import com.spring.digiprint.enums.ArtistApplicationStatus;

import java.util.List;
import java.util.Optional;

public interface ArtistApplicationService {

    /** User hiện tại (role USER) gửi đơn; không đổi role cho đến khi admin duyệt. */
    ArtistApplicationResponse submitApplication(ApplyToArtistRequest request);

    /** Đơn gần nhất của user đang đăng nhập (để hiển thị trạng thái). */
    Optional<ArtistApplicationResponse> getMyLatestApplication();

    /** Admin: lọc theo status; nếu null thì trả về tất cả, mới nhất trước. */
    List<ArtistApplicationResponse> listForAdmin(ArtistApplicationStatus status);

    /** Admin cập nhật trạng thái đơn: APPROVED (nâng USER → ARTIST) hoặc REJECTED. */
    ArtistApplicationResponse updateApplicationStatus(Integer applicationId, UpdateArtistApplicationStatusRequest request);
}
