package com.spring.digiprint.services;

import com.spring.digiprint.dtos.requests.OrderRequest;
import com.spring.digiprint.dtos.responses.OrderResponse;
import com.spring.digiprint.dtos.responses.PageResponse;
import com.spring.digiprint.enums.OrderStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderService {

    OrderResponse addOrder(OrderRequest request);

    OrderResponse updateDraftOrder(Integer id, OrderRequest request);

    OrderResponse getOrderById(Integer id);

    PageResponse<OrderResponse> filterOrders(
            OrderStatus status,
            Double priceMin,
            Double priceMax,
            String customer,
            String artist,
            LocalDateTime createdAtFrom,
            LocalDateTime createdAtTo,
            LocalDateTime completedAtFrom,
            LocalDateTime completedAtTo,
            String artistOrderMode,
            int page,
            int size
    );

    OrderResponse updateOrderStatus(Integer id, OrderStatus status);

    /** Upload một file deliverable; chỉ artist của commission / admin. */
    String saveCompletedDeliverableUpload(Integer orderItemId, MultipartFile file) throws IOException;

    /** Ghi đè danh sách path deliverables; chỉ artist của commission / admin. */
    OrderResponse updateOrderItemCompletedDeliverables(Integer orderItemId, List<String> paths);
}

