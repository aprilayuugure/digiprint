package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.responses.CreatorSuggestionResponse;
import com.spring.digiprint.dtos.responses.ProfileResponse;
import com.spring.digiprint.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/users")
@RestController
public class UserController {

    private final UserService userService;

    /**
     * Username search across all roles (not limited to artists).
     */
    @GetMapping("/search")
    public ResponseEntity<List<CreatorSuggestionResponse>> searchUsers(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(userService.searchUsers(q));
    }

    /**
     * Profile by username for any account role (USER, ARTIST, ADMIN).
     */
    @GetMapping("/profile/{username}")
    public ResponseEntity<ProfileResponse> getProfileByUsername(@PathVariable String username) {
        return ResponseEntity.ok(userService.getProfileByUsername(username));
    }
}
