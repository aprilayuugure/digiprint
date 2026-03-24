package com.spring.digiprint.dtos.requests;

import com.spring.digiprint.enums.Genre;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CommissionRequest {

    @NotBlank(message = "Commission type cannot be null")
    private String commissionType;

    /** Whole number (integer) only — no decimals. */
    @Min(value = 0, message = "Commission price must be >= 0")
    @Digits(integer = 10, fraction = 0, message = "Commission price must be an integer")
    private int commissionPrice;

    private String commissionDescription;

    @NotNull(message = "Genre cannot be null")
    private Genre genre;

    @NotNull(message = "User id cannot be null")
    private Integer userId;

    /**
     * Chỉ dùng khi {@code PUT /commissions/{id}}: danh sách path dưới
     * {@code /storage/commissions/{id}/...}. POST tạo mới không dùng — upload qua
     * {@code POST /commissions/{id}/attachments}.
     */
    private List<String> attachedFiles;
}

