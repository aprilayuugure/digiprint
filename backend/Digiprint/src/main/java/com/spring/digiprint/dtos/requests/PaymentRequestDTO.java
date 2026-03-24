package com.spring.digiprint.dtos.requests;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class PaymentRequestDTO {

    @NotNull(message = "Order id is required")
    private Integer orderId;

    /** VNPay expects amount in VND; server converts to x100 query value. */
    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be >= 1")
    private Long amount;

    /** Optional VNPay bank code (e.g. NCB, VNBANK, INTCARD). */
    private String bankCode;

    /** Optional order note shown on VNPay side. */
    private String orderInfo;

    /** Optional locale; defaults to 'vn'. */
    private String locale;
}
