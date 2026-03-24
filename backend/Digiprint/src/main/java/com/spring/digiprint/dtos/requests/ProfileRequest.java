package com.spring.digiprint.dtos.requests;

import com.spring.digiprint.enums.Gender;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ProfileRequest {
    private MultipartFile backgroundImage;

    private MultipartFile image;

    @NotBlank(message = "Username cannot be null")
    private String username;

    @NotBlank(message = "First name cannot be null")
    private String firstName;

    @NotBlank(message = "Last name cannot be null")
    private String lastName;

    @NotNull(message = "Date of birth cannot be null")
    private LocalDate dateOfBirth;

    @NotNull(message = "Gender cannot be null")
    private Gender gender;

    private String location;

    private String biography;
}
