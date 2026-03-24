package com.spring.digiprint.entities;

import com.spring.digiprint.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Integer paymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(name = "provider", length = 50, nullable = false)
    private String provider;

    @Column(name = "txn_ref", length = 100, nullable = false, unique = true)
    private String txnRef;

    @Column(name = "amount", nullable = false)
    private Long amount;

    @Column(name = "bank_code", length = 50)
    private String bankCode;

    @Column(name = "order_info", length = 500)
    private String orderInfo;

    @Column(name = "payment_url", length = 2000)
    private String paymentUrl;

    @Column(name = "vnp_response_code", length = 20)
    private String vnpResponseCode;

    @Column(name = "vnp_transaction_no", length = 100)
    private String vnpTransactionNo;

    @Column(name = "vnp_transaction_status", length = 20)
    private String vnpTransactionStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "raw_callback_payload", columnDefinition = "NVARCHAR(MAX)")
    private String rawCallbackPayload;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (provider == null || provider.isBlank()) {
            provider = "VNPAY";
        }
        if (paymentStatus == null) {
            paymentStatus = PaymentStatus.PENDING;
        }
    }
}
