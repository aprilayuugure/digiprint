package com.spring.digiprint.dtos.requests;
import com.spring.digiprint.enums.Role;
import jakarta.validation.constraints.*;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RegisterRequest {
    @NotBlank(message = "Email cannot be null")
    private String email;

    @NotBlank(message = "Password cannot be null")
    private String password;

    @NotNull(message = "Role cannot be null")
    private Role role;
}