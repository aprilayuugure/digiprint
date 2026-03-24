package com.spring.digiprint.dtos.requests;

import com.spring.digiprint.enums.ArtistApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class UpdateArtistApplicationStatusRequest {

    /** Chỉ {@link ArtistApplicationStatus#APPROVED} hoặc {@link ArtistApplicationStatus#REJECTED}. */
    @NotNull(message = "status is required")
    private ArtistApplicationStatus status;
}
