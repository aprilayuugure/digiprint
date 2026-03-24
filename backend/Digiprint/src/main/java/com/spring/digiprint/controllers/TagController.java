package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.responses.TagResponse;
import com.spring.digiprint.dtos.responses.PageResponse;
import com.spring.digiprint.dtos.responses.WorkPreviewResponse;
import com.spring.digiprint.dtos.requests.TagRequest;
import com.spring.digiprint.enums.Genre;
import com.spring.digiprint.services.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/tags")
@RestController
public class TagController {
    private final TagService tagService;

    @GetMapping
    public ResponseEntity<List<TagResponse>> getAllTags() {
        return ResponseEntity.ok(tagService.getAllTags());
    }

    @GetMapping("/genre")
    public ResponseEntity<List<TagResponse>> getTagsByGenre(@RequestParam Genre genre) {
        return ResponseEntity.ok(tagService.getTagsByGenre(genre));
    }

    @PostMapping
    public ResponseEntity<TagResponse> addTag(@Valid @RequestBody TagRequest request) {
        return ResponseEntity.ok(tagService.addTag(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TagResponse> updateTag(@PathVariable Integer id, @Valid @RequestBody TagRequest request) {
        return ResponseEntity.ok(tagService.updateTag(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Integer id) {
        tagService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/merge")
    public ResponseEntity<String> mergeTag(
            @RequestParam Integer targetTagId,
            @RequestParam Integer sourceTagId
    ) {
        tagService.mergeTag(targetTagId, sourceTagId);
        return ResponseEntity.ok("Tags merged successfully");
    }

    @GetMapping("/by-name/{tagName}")
    public ResponseEntity<TagResponse> getTagByName(@PathVariable String tagName) {
        return ResponseEntity.ok(tagService.getTagByName(tagName));
    }

    @PutMapping("/by-name/{tagName}/description")
    public ResponseEntity<TagResponse> updateTagDescriptionByName(
            @PathVariable String tagName,
            @RequestBody(required = false) java.util.Map<String, String> body
    ) {
        String tagDescription = body != null ? body.get("tagDescription") : null;
        return ResponseEntity.ok(tagService.updateTagDescriptionByName(tagName, tagDescription));
    }

    @GetMapping("/by-name/{tagName}/works")
    public ResponseEntity<PageResponse<WorkPreviewResponse>> getWorksByTagName(
            @PathVariable String tagName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(tagService.getWorksByTagName(tagName, page, size));
    }
}
