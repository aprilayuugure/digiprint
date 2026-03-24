package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.requests.UpdateArtistApplicationStatusRequest;
import com.spring.digiprint.dtos.responses.ArtistApplicationResponse;
import com.spring.digiprint.enums.ArtistApplicationStatus;
import com.spring.digiprint.services.ArtistApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/artist-applications")
public class AdminArtistApplicationController {

    private final ArtistApplicationService artistApplicationService;

    @GetMapping
    public ResponseEntity<List<ArtistApplicationResponse>> list(
            @RequestParam(required = false) ArtistApplicationStatus status) {
        return ResponseEntity.ok(artistApplicationService.listForAdmin(status));
    }

    /**
     * Body: {@code {"status":"APPROVED"}} hoặc {@code {"status":"REJECTED"}} (đơn phải đang PENDING).
     */
    @PatchMapping("/{applicationId}/status")
    public ResponseEntity<ArtistApplicationResponse> updateApplicationStatus(
            @PathVariable Integer applicationId,
            @Valid @RequestBody UpdateArtistApplicationStatusRequest body) {
        return ResponseEntity.ok(artistApplicationService.updateApplicationStatus(applicationId, body));
    }
}
