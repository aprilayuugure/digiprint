package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.requests.ChangePasswordRequest;
import com.spring.digiprint.dtos.requests.ProfileRequest;
import com.spring.digiprint.dtos.requests.UpdateUsernameRequest;
import com.spring.digiprint.dtos.responses.AdminUserRowResponse;
import com.spring.digiprint.dtos.responses.ProfileResponse;
import com.spring.digiprint.dtos.requests.ApplyToArtistRequest;
import com.spring.digiprint.dtos.responses.ArtistApplicationResponse;
import com.spring.digiprint.dtos.responses.ArtistDashboardResponse;
import com.spring.digiprint.dtos.responses.AdminDashboardResponse;
import com.spring.digiprint.services.AccountService;
import com.spring.digiprint.services.AdminDashboardService;
import com.spring.digiprint.services.ArtistApplicationService;
import com.spring.digiprint.services.ArtistDashboardService;
import com.spring.digiprint.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/me")
@RestController
public class MeController {
    private final UserService userService;
    private final AccountService accountService;
    private final ArtistApplicationService artistApplicationService;
    private final ArtistDashboardService artistDashboardService;
    private final AdminDashboardService adminDashboardService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getMyProfile() {
        return ResponseEntity.ok(userService.getMyProfile());
    }

    /** Thống kê dashboard nghệ sĩ (followers, artworks, doanh thu, biểu đồ theo tháng). */
    @GetMapping("/dashboard")
    public ResponseEntity<ArtistDashboardResponse> getArtistDashboard() {
        return ResponseEntity.ok(artistDashboardService.getDashboardForCurrentArtist());
    }

    /** Tổng quan hệ thống cho admin dashboard. */
    @GetMapping("/admin/dashboard")
    public ResponseEntity<AdminDashboardResponse> getAdminDashboard() {
        return ResponseEntity.ok(adminDashboardService.getDashboardForCurrentAdmin());
    }

    /** Danh sách user cho màn Manage users (admin). */
    @GetMapping("/admin/users")
    public ResponseEntity<List<AdminUserRowResponse>> getAdminUsers() {
        return ResponseEntity.ok(userService.getAdminUsers());
    }

    @PutMapping(consumes = "multipart/form-data")
    public ResponseEntity<ProfileResponse> updateMyProfile(@Valid @ModelAttribute ProfileRequest request) {
        return ResponseEntity.ok(userService.updateMyProfile(request));
    }

    @PatchMapping(path = "/username", consumes = "application/json")
    public ResponseEntity<ProfileResponse> updateMyUsername(@Valid @RequestBody UpdateUsernameRequest request) {
        return ResponseEntity.ok(userService.updateMyUsername(request));
    }

    @PutMapping(path = "/change-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        if (!isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }

        accountService.changePassword(request);
        return ResponseEntity.ok("Password changed successfully");
    }

    /**
     * Gửi đơn xin làm nghệ sĩ (chờ admin duyệt). Body JSON tuỳ chọn: {@code {"message":"..."}}.
     */
    @PostMapping(path = "/apply-artist")
    public ResponseEntity<ArtistApplicationResponse> applyToArtist(
            @RequestBody(required = false) ApplyToArtistRequest body) {
        if (!isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }

        return ResponseEntity.ok(artistApplicationService.submitApplication(body));
    }

    /** Đơn gần nhất của bạn (trạng thái chờ duyệt / đã xử lý). */
    @GetMapping(path = "/artist-application")
    public ResponseEntity<ArtistApplicationResponse> getMyArtistApplication() {
        if (!isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }

        return artistApplicationService.getMyLatestApplication()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    private boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal());
    }
}
