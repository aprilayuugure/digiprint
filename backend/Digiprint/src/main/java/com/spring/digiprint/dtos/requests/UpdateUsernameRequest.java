package com.spring.digiprint.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class UpdateUsernameRequest {
    @NotBlank(message = "Username cannot be null")
    private String username;
}
