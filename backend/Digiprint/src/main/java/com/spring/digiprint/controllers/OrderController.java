package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.requests.OrderCompletedDeliverablesRequest;
import com.spring.digiprint.dtos.requests.OrderRequest;
import com.spring.digiprint.dtos.responses.OrderResponse;
import com.spring.digiprint.dtos.responses.PageResponse;
import com.spring.digiprint.enums.OrderStatus;
import com.spring.digiprint.services.FileStorageService;
import com.spring.digiprint.services.OrderService;
import com.spring.digiprint.utils.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/orders")
@RestController
public class OrderController {

    private final OrderService orderService;

    private final FileStorageService fileStorageService;

    @PostMapping(value = "/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadOrderAttachment(@RequestParam("file") MultipartFile file)
            throws IOException {
        Integer accountId = SecurityUtil.getCurrentUserId();
        String path = fileStorageService.savePendingOrderAttachment(file, accountId);
        return ResponseEntity.ok(Map.of("path", path));
    }

    @PostMapping
    public ResponseEntity<OrderResponse> addOrder(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.addOrder(request));
    }

    /** Chủ đơn sửa đơn ở trạng thái DRAFT; lưu xong → PENDING. */
    @PutMapping("/draft/{id}")
    public ResponseEntity<OrderResponse> updateDraftOrder(
            @PathVariable Integer id, @Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.updateDraftOrder(id, request));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<OrderResponse>> filterOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Double priceMin,
            @RequestParam(required = false) Double priceMax,
            @RequestParam(required = false) String customer,
            @RequestParam(required = false) String artist,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createdAtFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createdAtTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime completedAtFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime completedAtTo,
            @RequestParam(required = false) String artistOrderMode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(orderService.filterOrders(
                status, priceMin, priceMax,
                customer, artist,
                createdAtFrom, createdAtTo, completedAtFrom, completedAtTo,
                artistOrderMode,
                page, size
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Integer id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Integer id,
            @RequestParam OrderStatus status
    ) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @PostMapping(value = "/items/{orderItemId}/completed-deliverables/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadCompletedDeliverable(
            @PathVariable Integer orderItemId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        String path = orderService.saveCompletedDeliverableUpload(orderItemId, file);
        return ResponseEntity.ok(Map.of("path", path));
    }

    /** Ghi danh sách path deliverables (thay thế toàn bộ); chỉ artist / admin. */
    @PatchMapping("/items/{orderItemId}/completed-deliverables")
    public ResponseEntity<OrderResponse> updateCompletedDeliverables(
            @PathVariable Integer orderItemId,
            @RequestBody(required = false) OrderCompletedDeliverablesRequest body
    ) {
        return ResponseEntity.ok(
                orderService.updateOrderItemCompletedDeliverables(
                        orderItemId, body != null ? body.paths() : null));
    }
}

