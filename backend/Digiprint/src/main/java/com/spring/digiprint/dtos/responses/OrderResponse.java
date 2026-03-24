package com.spring.digiprint.dtos.responses;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.spring.digiprint.entities.Account;
import com.spring.digiprint.entities.Commission;
import com.spring.digiprint.entities.Order;
import com.spring.digiprint.entities.OrderItem;
import com.spring.digiprint.enums.PaymentStatus;
import com.spring.digiprint.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.spring.digiprint.entities.User;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class OrderResponse {

    private Integer orderId;

    /** Username profile (người đặt) — fallback email account nếu chưa đặt username. */
    @JsonProperty("customerUsername")
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String customerUsername;

    private List<OrderItemResponse> orderItems;

    /** Tổng tiền đơn hàng (đã lưu khi tạo order). */
    @JsonProperty("totalPrice")
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private double totalPrice;

    private OrderStatus orderStatus;

    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    private Integer customerAccountId;

    /** Trạng thái thanh toán gần nhất của đơn (nếu có). */
    private PaymentStatus paymentStatus;

    /**
     * Tên artist (chủ commission) trong đơn — nhiều artist khác nhau thì nối bằng dấu phẩy.
     * Dùng khi người xem là người đặt (My orders) để biết đặt với ai.
     */
    @JsonProperty("artistSummary")
    private String artistSummary;

    public OrderResponse(Order order) {
        this.orderId = order.getOrderId();
        this.orderStatus = order.getOrderStatus();
        this.createdAt = order.getCreatedAt();
        this.completedAt = order.getCompletedAt();

        Account customer = order.getCustomer();
        if (customer != null) {
            this.customerAccountId = customer.getAccountId();
            this.customerUsername = resolveCustomerLabel(customer);
        }

        List<OrderItem> items = order.getOrderItems();
        this.orderItems = items != null
                ? items.stream().map(OrderItemResponse::new).toList()
                : List.of();

        this.artistSummary = buildArtistSummary(items);

        double tp = order.getPrice();
        if (tp <= 0.0 && items != null) {
            double sum = 0.0;
            for (OrderItem i : items) {
                Commission c = i.getCommission();
                if (c != null) {
                    sum += (double) c.getCommissionPrice() * i.getQuantity();
                }
            }
            if (sum > 0.0) {
                tp = sum;
            }
        }
        this.totalPrice = tp;
    }

    private static String resolveCustomerLabel(Account c) {
        if (c.getUser() != null) {
            String u = c.getUser().getUsername();
            if (u != null && !u.isBlank()) {
                return u;
            }
        }
        String email = c.getEmail();
        if (email != null && !email.isBlank()) {
            return email;
        }
        return null;
    }

    private static String buildArtistSummary(List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            return null;
        }
        Set<String> labels = new LinkedHashSet<>();
        for (OrderItem i : items) {
            Commission c = i.getCommission();
            if (c == null || c.getUser() == null) {
                continue;
            }
            User seller = c.getUser();
            String label = seller.getUsername();
            if (label == null || label.isBlank()) {
                if (seller.getAccount() != null) {
                    label = seller.getAccount().getEmail();
                }
            }
            if (label != null && !label.isBlank()) {
                labels.add(label.trim());
            }
        }
        if (labels.isEmpty()) {
            return null;
        }
        return String.join(", ", labels);
    }
}

