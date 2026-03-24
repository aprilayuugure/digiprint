package com.spring.digiprint.dtos.requests;

import com.spring.digiprint.enums.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class UpdateWorkRequest {
    @NotNull(message = "Genre cannot be null")
    private Genre genre;

    private MultipartFile file;

    @NotBlank(message = "Title cannot be null")
    private String workTitle;

    private String workDescription;

    @NotNull(message = "Rating cannot be null")
    private Rating rating;

    private List<String> workTags;
}
