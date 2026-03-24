package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.requests.TagRequest;
import com.spring.digiprint.dtos.responses.PageResponse;
import com.spring.digiprint.dtos.responses.TagResponse;
import com.spring.digiprint.dtos.responses.WorkPreviewResponse;
import com.spring.digiprint.entities.Tag;
import com.spring.digiprint.entities.WorkTag;
import com.spring.digiprint.enums.Genre;
import com.spring.digiprint.repositories.TagRepository;
import com.spring.digiprint.repositories.WorkRepository;
import com.spring.digiprint.services.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.Objects;

@Transactional
@RequiredArgsConstructor
@Service
public class TagServiceImpl implements TagService {
    private final TagRepository tagRepo;
    private final WorkRepository workRepo;

    @Override
    public List<TagResponse> getAllTags() {
        return tagRepo.findAll()
                .stream()
                .map(TagResponse::new)
                .toList();
    }

    @Override
    public List<TagResponse> getTagsByGenre(Genre g) {
        return tagRepo.getTagByTagGenre(g)
                .stream()
                .map(TagResponse::new)
                .toList();
    }

    @Override
    public TagResponse getTagByName(String tagName) {
        if (tagName == null || tagName.isBlank()) {
            throw new IllegalArgumentException("Tag name is required");
        }

        Tag t = tagRepo.findByTagName(tagName.trim())
                .orElseThrow(() -> new RuntimeException("Tag not found"));

        return new TagResponse(t);
    }

    @Override
    public TagResponse updateTagDescriptionByName(String tagName, String tagDescription) {
        if (tagName == null || tagName.isBlank()) {
            throw new IllegalArgumentException("Tag name is required");
        }

        Tag t = tagRepo.findByTagName(tagName.trim())
                .orElseThrow(() -> new RuntimeException("Tag not found"));

        String nextDescription = tagDescription == null ? null : tagDescription.trim();
        t.setTagDescription(nextDescription == null || nextDescription.isBlank() ? null : nextDescription);

        return new TagResponse(tagRepo.save(t));
    }

    @Override
    public PageResponse<WorkPreviewResponse> getWorksByTagName(String tagName, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "workUploadDate"));

        Page<WorkPreviewResponse> results = workRepo.findWorksByTagName(tagName, pageable);

        return new PageResponse<>(results);
    }

    @Override
    public TagResponse addTag(TagRequest request) {
        Tag t = new Tag();

        t.setTagName(request.getTagName());
        t.setTagDescription(request.getTagDescription());
        t.setTagGenre(request.getTagGenre());

        return new TagResponse(tagRepo.save(t));
    }

    @Override
    public TagResponse updateTag(Integer id, TagRequest request) {
        if (id == null) {
            throw new IllegalArgumentException("Tag id is required");
        }

        Tag t = tagRepo.findById(id)
                        .orElseThrow(() -> new RuntimeException("Tag not found"));

        t.setTagName(request.getTagName());
        t.setTagDescription(request.getTagDescription());
        t.setTagGenre(request.getTagGenre());

        return new TagResponse(tagRepo.save(t));
    }

    @Override
    public void deleteTag(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("Tag id is required");
        }

        Tag t = Objects.requireNonNull(
                tagRepo.findById(id)
                        .orElseThrow(() -> new RuntimeException("Tag not found"))
        );

        tagRepo.delete(t);
    }

    @Override
    public void mergeTag(Integer targetTagId, Integer sourceTagId) {
        if (targetTagId == null || sourceTagId == null) {
            throw new IllegalArgumentException("Tag ids are required");
        }

        if (targetTagId.equals(sourceTagId)) {
            return;
        }

        Tag target = Objects.requireNonNull(
                tagRepo.findById(targetTagId)
                        .orElseThrow(() -> new RuntimeException("Target tag not found"))
        );
        Tag source = Objects.requireNonNull(
                tagRepo.findById(sourceTagId)
                        .orElseThrow(() -> new RuntimeException("Source tag not found"))
        );

        if (target.getTagGenre() != source.getTagGenre()) {
            throw new RuntimeException("Cannot merge tags with different genres");
        }

        // Duyệt trên bản sao để tránh ConcurrentModification khi remove khỏi collection gốc.
        for (WorkTag wt : new java.util.ArrayList<>(source.getWorkTags())) {
            var work = wt.getWork();

            boolean hasTarget = work.getWorkTags().stream()
                    .anyMatch(existing -> existing != wt && existing.getTag().getTagId().equals(targetTagId));

            source.setTagWorkCount(source.getTagWorkCount() - 1);

            if (hasTarget) {
                // Work đã có target tag rồi: bỏ source-tag relation hiện tại.
                work.getWorkTags().remove(wt);
                source.getWorkTags().remove(wt);
                continue;
            }

            // Chuyển relation hiện có từ source -> target, không tạo WorkTag mới để tránh trùng khóa.
            source.getWorkTags().remove(wt);
            wt.setTag(target);
            target.getWorkTags().add(wt);
            target.setTagWorkCount(target.getTagWorkCount() + 1);
        }

        if (source.getTagWorkCount() <= 0) {
            tagRepo.delete(source);
        }
    }

}
