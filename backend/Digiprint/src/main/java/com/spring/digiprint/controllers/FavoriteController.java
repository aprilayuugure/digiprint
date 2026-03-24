package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.responses.PageResponse;
import com.spring.digiprint.dtos.responses.WorkPreviewResponse;
import com.spring.digiprint.services.FavoriteService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/favorites")
@RestController
public class FavoriteController {

    private final FavoriteService favoriteService;

    private boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal());
    }

    @PostMapping("/{workId}")
    public ResponseEntity<Void> addFavorite(@PathVariable @NotNull Integer workId) {
        if (!isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        favoriteService.addFavorite(workId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{workId}")
    public ResponseEntity<Void> removeFavorite(@PathVariable @NotNull Integer workId) {
        if (!isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        favoriteService.removeFavorite(workId);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/status")
    public ResponseEntity<Boolean> isFavoritedByMe(@RequestParam @NotNull Integer workId) {
        if (!isAuthenticated()) {
            return ResponseEntity.ok(false);
        }
        return ResponseEntity.ok(favoriteService.isFavorited(workId));
    }

    @GetMapping("/list")
    public ResponseEntity<PageResponse<WorkPreviewResponse>> getMyFavoriteWorks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (!isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        return ResponseEntity.ok(favoriteService.getMyFavoriteWorks(page, size));
    }
}
