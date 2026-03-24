package com.spring.digiprint.dtos.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ForgotPasswordRequest {

    @NotBlank(message = "Email cannot be null")
    @Email(message = "Email is not valid")
    private String email;

    @NotBlank(message = "New password cannot be null")
    private String newPassword;
}

