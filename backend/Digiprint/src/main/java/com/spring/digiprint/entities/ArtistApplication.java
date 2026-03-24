package com.spring.digiprint.entities;

import com.spring.digiprint.enums.ArtistApplicationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "artist_applications")
public class ArtistApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "application_id")
    private Integer applicationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ArtistApplicationStatus status;

    /** Lý do / lời nhắn khi xin làm nghệ sĩ (bắt buộc khi tạo đơn mới). */
    @Column(name = "reason", length = 2000)
    private String reason;

    /** Cột cũ — giữ để tương thích dữ liệu đã lưu trước khi có {@link #reason}. */
    @Column(name = "applicant_message", length = 2000)
    private String applicantMessage;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ArtistApplicationStatus.PENDING;
        }
    }
}
