package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.requests.CommissionRequest;
import com.spring.digiprint.dtos.responses.CommissionResponse;
import com.spring.digiprint.enums.Genre;
import com.spring.digiprint.services.CommissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/commissions")
@RestController
public class CommissionController {

    private final CommissionService commissionService;

    /** File lưu tại {@code /storage/commissions/{commissionId}/...} (commission phải đã tồn tại). */
    @PostMapping(value = "/{commissionId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadCommissionAttachment(
            @PathVariable Integer commissionId,
            @RequestParam("file") MultipartFile file,
            @RequestParam Genre genre
    ) throws IOException {
        String path = commissionService.uploadCommissionAttachment(commissionId, file, genre);
        return ResponseEntity.ok(Map.of("path", path));
    }

    @PostMapping
    public ResponseEntity<CommissionResponse> addCommission(@Valid @RequestBody CommissionRequest request) {
        return ResponseEntity.ok(commissionService.addCommission(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommissionResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(commissionService.getCommissionById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommissionResponse> updateCommission(
            @PathVariable Integer id,
            @Valid @RequestBody CommissionRequest request
    ) {
        return ResponseEntity.ok(commissionService.updateCommission(id, request));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CommissionResponse>> getByUser(@PathVariable Integer userId) {
        return ResponseEntity.ok(commissionService.getCommissionsByUser(userId));
    }

    @GetMapping("/genre")
    public ResponseEntity<List<CommissionResponse>> getByGenre(@RequestParam Genre genre) {
        return ResponseEntity.ok(commissionService.getCommissionsByGenre(genre));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCommission(@PathVariable Integer id) {
        commissionService.deleteCommission(id);
        return ResponseEntity.noContent().build();
    }
}

