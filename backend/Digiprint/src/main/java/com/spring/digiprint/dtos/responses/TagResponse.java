package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.Tag;
import com.spring.digiprint.enums.Genre;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class TagResponse {
    private Integer tagId;

    private String tagName;

    private String tagDescription;

    private int tagWorkCount;

    private Genre tagGenre;

    public TagResponse(Tag t) {
        this.tagId = t.getTagId();
        this.tagName = t.getTagName();
        this.tagDescription = t.getTagDescription();
        this.tagWorkCount = t.getTagWorkCount();
        this.tagGenre = t.getTagGenre();
    }
}
