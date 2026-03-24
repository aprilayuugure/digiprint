package com.spring.digiprint.services;

import com.spring.digiprint.dtos.responses.PageResponse;
import com.spring.digiprint.dtos.requests.TagRequest;
import com.spring.digiprint.dtos.responses.TagResponse;
import com.spring.digiprint.dtos.responses.WorkPreviewResponse;
import com.spring.digiprint.enums.Genre;

import java.util.List;

public interface TagService {
    public List<TagResponse> getAllTags();

    public List<TagResponse> getTagsByGenre(Genre g);

    public TagResponse getTagByName(String tagName);

    public TagResponse updateTagDescriptionByName(String tagName, String tagDescription);

    public PageResponse<WorkPreviewResponse> getWorksByTagName(String tagName, int page, int size);

    public TagResponse addTag(TagRequest request);

    public TagResponse updateTag(Integer id, TagRequest request);

    public void deleteTag(Integer id);

    void mergeTag(Integer targetTagId, Integer sourceTagId);
}
