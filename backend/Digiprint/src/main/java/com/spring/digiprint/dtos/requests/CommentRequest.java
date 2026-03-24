package com.spring.digiprint.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CommentRequest {

    @NotNull
    private Integer workId;

    private Integer replyToId;

    @NotBlank
    private String commentContent;
}

