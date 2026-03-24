package com.spring.digiprint.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ChangePasswordRequest {
    @NotBlank(message = "Current password cannot be null")
    private String currentPassword;

    @NotBlank(message = "New password cannot be null")
    private String newPassword;

    @NotBlank(message = "Confirm new password cannot be null")
    private String confirmNewPassword;
}
