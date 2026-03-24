package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.requests.*;
import com.spring.digiprint.dtos.responses.*;
import com.spring.digiprint.enums.Genre;
import com.spring.digiprint.enums.Rating;
import com.spring.digiprint.services.WorkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.List;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/works")
@RestController
public class WorkController {

    private final WorkService workService;

    @GetMapping("/search")
    public PageResponse<WorkPreviewResponse> searchWorks(
            @RequestParam Genre genre,
            @RequestParam(required = false) String artistName,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) List<Rating> ratings,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        List<Rating> effectiveRatings = ratings;
        if (!isAuthenticated()) {
            effectiveRatings = ratings == null || ratings.isEmpty()
                    ? List.of(Rating.SAFE, Rating.SUGGESTIVE)
                    : ratings.stream()
                            .filter(r -> r == Rating.SAFE || r == Rating.SUGGESTIVE)
                            .toList();
        }
        return workService.filterWorks(genre, artistName, startDate, endDate, tags, effectiveRatings, sort, page, size);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkResponse> getWorkById(@PathVariable Integer id) {
        WorkResponse work = workService.getWorkById(id);
        if (!isAuthenticated() && work.getRating() == Rating.NSFW) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Login required to view this content");
        }
        return ResponseEntity.ok(work);
    }

    private boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal());
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<WorkResponse> addWork(@Valid @ModelAttribute AddWorkRequest request) {
        return ResponseEntity.ok(workService.addWork(request));
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<WorkResponse> updateWork(
            @PathVariable Integer id,
            @Valid @ModelAttribute UpdateWorkRequest request) {

        return ResponseEntity.ok(workService.updateWork(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWork(@PathVariable Integer id) {
        workService.deleteWork(id);
        return ResponseEntity.noContent().build();
    }
}