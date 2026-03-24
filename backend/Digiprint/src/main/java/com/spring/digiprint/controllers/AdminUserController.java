package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.responses.AdminUserRowResponse;
import com.spring.digiprint.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/admin/users")
@RestController
public class AdminUserController {
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<AdminUserRowResponse>> getAdminUsers() {
        return ResponseEntity.ok(userService.getAdminUsers());
    }
}
