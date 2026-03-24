package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.responses.ProfileResponse;
import com.spring.digiprint.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/profiles")
@RestController
public class ProfileController {

    private final UserService userService;

    /**
     * Public profile by username for any account role (USER, ARTIST, ADMIN).
     */
    @GetMapping("/{username}")
    public ResponseEntity<ProfileResponse> getProfileByUsername(@PathVariable String username) {
        return ResponseEntity.ok(userService.getProfileByUsername(username));
    }
}

