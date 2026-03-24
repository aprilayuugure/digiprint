package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.Payment;
import com.spring.digiprint.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class PaymentResponseDTO {

    private Integer paymentId;
    private Integer orderId;
    private String provider;
    private String txnRef;
    private Long amount;
    private String bankCode;
    private String orderInfo;
    private String paymentUrl;
    private String vnpResponseCode;
    private String vnpTransactionNo;
    private String vnpTransactionStatus;
    private PaymentStatus paymentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    public PaymentResponseDTO(Payment p) {
        this.paymentId = p.getPaymentId();
        this.orderId = p.getOrder() != null ? p.getOrder().getOrderId() : null;
        this.provider = p.getProvider();
        this.txnRef = p.getTxnRef();
        this.amount = p.getAmount();
        this.bankCode = p.getBankCode();
        this.orderInfo = p.getOrderInfo();
        this.paymentUrl = p.getPaymentUrl();
        this.vnpResponseCode = p.getVnpResponseCode();
        this.vnpTransactionNo = p.getVnpTransactionNo();
        this.vnpTransactionStatus = p.getVnpTransactionStatus();
        this.paymentStatus = p.getPaymentStatus();
        this.createdAt = p.getCreatedAt();
        this.paidAt = p.getPaidAt();
    }
}
