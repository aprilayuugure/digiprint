package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.responses.FollowResponse;
import com.spring.digiprint.services.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/follows")
@RestController
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{artistId}")
    public ResponseEntity<Void> follow(@PathVariable Integer artistId) {
        followService.follow(artistId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{artistId}")
    public ResponseEntity<Void> unfollow(@PathVariable Integer artistId) {
        followService.unfollow(artistId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/following")
    public ResponseEntity<List<FollowResponse>> getMyFollowing() {
        return ResponseEntity.ok(followService.getFollowing());
    }

    @GetMapping("/artist/{artistId}/followers")
    public ResponseEntity<List<FollowResponse>> getFollowers(@PathVariable Integer artistId) {
        return ResponseEntity.ok(followService.getFollowers(artistId));
    }
}

