package com.spring.digiprint.dtos.requests;

import lombok.*;

/** Body khi user gửi đơn xin làm nghệ sĩ. */
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ApplyToArtistRequest {

    /** Lý do / lời nhắn (ưu tiên hơn {@link #message}). Lưu vào {@code applicant_message}. */
    private String reason;

    /** @deprecated Dùng {@link #reason}. Giữ để tương thích client cũ. */
    @Deprecated
    private String message;
}
