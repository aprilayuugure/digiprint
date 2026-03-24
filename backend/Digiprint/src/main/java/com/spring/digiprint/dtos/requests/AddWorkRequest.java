package com.spring.digiprint.dtos.requests;

import com.spring.digiprint.enums.*;
import java.util.List;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class AddWorkRequest {
    @NotNull(message = "Genre cannot be null")
    private Genre genre;

    @NotNull(message = "File cannot be null")
    private MultipartFile file;

    @NotBlank(message = "Title cannot be null")
    private String workTitle;

    private String workDescription;

    @NotNull(message = "Rating cannot be null")
    private Rating rating;

    private List<String> workTags;
}
