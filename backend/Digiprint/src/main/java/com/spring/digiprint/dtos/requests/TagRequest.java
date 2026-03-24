package com.spring.digiprint.dtos.requests;

import com.spring.digiprint.enums.Genre;
import jakarta.validation.constraints.*;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class TagRequest {
    @NotBlank(message = "Tag name cannot be null")
    private String tagName;

    @NotBlank(message = "Tag description cannot be null")
    private String tagDescription;

    @NotNull(message = "Tag genre cannot be null")
    private Genre tagGenre;
}
