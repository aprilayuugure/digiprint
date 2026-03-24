package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.ArtistApplication;
import com.spring.digiprint.enums.ArtistApplicationStatus;
import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ArtistApplicationResponse {

    private Integer applicationId;
    private Integer accountId;
    private String email;
    private String username;
    private ArtistApplicationStatus status;
    private String reason;
    /** Giữ field này cho client cũ; ưu tiên {@link #reason} từ entity, fallback {@code applicant_message}. */
    private String applicantMessage;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;

    public static ArtistApplicationResponse from(ArtistApplication a, String username) {
        ArtistApplicationResponse r = new ArtistApplicationResponse();
        r.setApplicationId(a.getApplicationId());
        r.setAccountId(a.getAccount().getAccountId());
        r.setEmail(a.getAccount().getEmail());
        r.setUsername(username);
        r.setStatus(a.getStatus());
        String msg = a.getReason();
        if (msg == null || msg.isBlank()) {
            msg = a.getApplicantMessage();
        }
        r.setReason(msg);
        r.setApplicantMessage(msg);
        r.setRequestedAt(a.getRequestedAt());
        r.setProcessedAt(a.getProcessedAt());
        return r;
    }
}
