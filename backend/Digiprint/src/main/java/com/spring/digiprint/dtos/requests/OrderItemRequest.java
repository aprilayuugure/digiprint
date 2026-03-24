package com.spring.digiprint.dtos.requests;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class OrderItemRequest {

    @NotNull(message = "Commission id cannot be null")
    private Integer commissionId;

    @NotNull(message = "Quantity cannot be null")
    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;

    /** Optional note for this line item. */
    private String orderDescription;

    /** Optional image URLs or storage paths (references only). */
    private List<String> attachedImages;
}

