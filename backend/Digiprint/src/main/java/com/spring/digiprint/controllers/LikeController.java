package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.responses.LikeResponse;
import com.spring.digiprint.services.LikeService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/likes")
@RestController
public class LikeController {

    private final LikeService likeService;

    private boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal());
    }

    @PostMapping("/{workId}")
    public ResponseEntity<Void> like(@PathVariable @NotNull Integer workId) {
        if (!isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required to like works");
        }
        likeService.like(workId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{workId}")
    public ResponseEntity<Void> unlike(@PathVariable @NotNull Integer workId) {
        if (!isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required to unlike works");
        }
        likeService.unlike(workId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/work/{workId}")
    public ResponseEntity<List<LikeResponse>> getLikesByWork(@PathVariable @NotNull Integer workId) {
        return ResponseEntity.ok(likeService.getLikesByWorkId(workId));
    }

    @GetMapping("/me/{workId}")
    public ResponseEntity<Boolean> isLikedByMe(@PathVariable @NotNull Integer workId) {
        if (!isAuthenticated()) {
            return ResponseEntity.ok(false);
        }
        return ResponseEntity.ok(likeService.isLiked(workId));
    }
}

