package com.spring.digiprint.dtos.responses;

import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class WorkPreviewResponse {
    private Integer workId;

    private Integer likeCount;

    private String thumbnail;

    private String avatar;

    private String creator;
}
