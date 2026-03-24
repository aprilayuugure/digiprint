package com.spring.digiprint.dtos.requests;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class LoginRequest {
    @NotBlank(message = "Login identifier cannot be null")
    private String emailOrUsername;

    @NotBlank(message = "Password cannot be null")
    private String password;
}
