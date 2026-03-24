package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.requests.OrderItemRequest;
import com.spring.digiprint.dtos.requests.OrderRequest;
import com.spring.digiprint.dtos.responses.OrderResponse;
import com.spring.digiprint.dtos.responses.PageResponse;
import com.spring.digiprint.entities.Account;
import com.spring.digiprint.entities.Commission;
import com.spring.digiprint.entities.CommissionSnapshot;
import com.spring.digiprint.entities.Order;
import com.spring.digiprint.entities.OrderItem;
import com.spring.digiprint.entities.Payment;
import com.spring.digiprint.entities.User;
import com.spring.digiprint.enums.OrderStatus;
import com.spring.digiprint.enums.Role;
import com.spring.digiprint.repositories.AccountRepository;
import com.spring.digiprint.repositories.CommissionRepository;
import com.spring.digiprint.repositories.OrderItemRepository;
import com.spring.digiprint.repositories.OrderRepository;
import com.spring.digiprint.repositories.PaymentRepository;
import com.spring.digiprint.services.FileStorageService;
import com.spring.digiprint.services.OrderService;
import com.spring.digiprint.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Transactional
@RequiredArgsConstructor
@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final CommissionRepository commissionRepo;
    private final AccountRepository accountRepo;
    private final PaymentRepository paymentRepo;
    private final FileStorageService fileStorageService;

    @Override
    public OrderResponse addOrder(OrderRequest request) {
        Integer accountId = SecurityUtil.getCurrentUserId();
        Account customer = accountRepo.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        Integer customerUserId = customer.getUser() != null ? customer.getUser().getUserId() : null;

        Order order = new Order();
        order.setCustomer(customer);
        order.setOrderStatus(OrderStatus.PENDING);

        List<OrderItem> items = new ArrayList<>();
        double totalPrice = 0.0;
        for (OrderItemRequest itemReq : request.getOrderItems()) {
            Commission commission = commissionRepo.findById(itemReq.getCommissionId())
                    .orElseThrow(() -> new RuntimeException("Commission not found"));
            assertNotSelfOrder(customerUserId, commission);

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setCommission(commission);
            item.setCommissionSnapshot(new CommissionSnapshot(
                    commission.getCommissionType(),
                    commission.getGenre() != null ? commission.getGenre().name() : null,
                    commission.getCommissionPrice()
            ));
            item.setQuantity(itemReq.getQuantity());
            item.setOrderDescription(itemReq.getOrderDescription());
            item.setAttachedImages(itemReq.getAttachedImages());
            item.setCompletedDeliverables(null);
            items.add(item);

            totalPrice += (double) commission.getCommissionPrice() * itemReq.getQuantity();
        }
        order.setOrderItems(items);
        order.setPrice(totalPrice);

        Order saved = orderRepo.save(order);
        touchOrderGraph(saved);
        return toOrderResponseWithPayment(saved);
    }

    @Override
    public OrderResponse updateDraftOrder(Integer id, OrderRequest request) {
        Integer accountId = SecurityUtil.getCurrentUserId();
        Account customer = accountRepo.findById(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found"));
        Integer customerUserId = customer.getUser() != null ? customer.getUser().getUserId() : null;

        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        touchOrderGraph(order);

        if (order.getOrderStatus() != OrderStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft orders can be updated");
        }
        if (order.getCustomer() == null || !order.getCustomer().getAccountId().equals(accountId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your order");
        }

        if (order.getOrderItems() == null) {
            order.setOrderItems(new ArrayList<>());
        } else {
            order.getOrderItems().clear();
        }

        double totalPrice = 0.0;
        for (OrderItemRequest itemReq : request.getOrderItems()) {
            Commission commission = commissionRepo.findById(itemReq.getCommissionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Commission not found"));
            assertNotSelfOrder(customerUserId, commission);

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setCommission(commission);
            item.setCommissionSnapshot(new CommissionSnapshot(
                    commission.getCommissionType(),
                    commission.getGenre() != null ? commission.getGenre().name() : null,
                    commission.getCommissionPrice()
            ));
            item.setQuantity(itemReq.getQuantity());
            item.setOrderDescription(itemReq.getOrderDescription());
            item.setAttachedImages(itemReq.getAttachedImages());
            item.setCompletedDeliverables(null);
            order.getOrderItems().add(item);

            totalPrice += (double) commission.getCommissionPrice() * itemReq.getQuantity();
        }
        order.setPrice(totalPrice);
        order.setOrderStatus(OrderStatus.PENDING);

        Order saved = orderRepo.save(order);
        touchOrderGraph(saved);
        return toOrderResponseWithPayment(saved);
    }

    @Override
    public String saveCompletedDeliverableUpload(Integer orderItemId, MultipartFile file) throws IOException {
        OrderItem item = orderItemRepo.findByIdWithOrderAndCommission(orderItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order item not found"));
        touchOrderItemGraph(item);
        assertArtistOrAdminCanEditDeliverables(item);
        return fileStorageService.saveOrderItemCompletedDeliverable(file, orderItemId);
    }

    @Override
    public OrderResponse updateOrderItemCompletedDeliverables(Integer orderItemId, List<String> paths) {
        OrderItem item = orderItemRepo.findByIdWithOrderAndCommission(orderItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order item not found"));
        touchOrderItemGraph(item);
        assertArtistOrAdminCanEditDeliverables(item);

        if (paths != null) {
            validateDeliverablePathsForOrderItem(orderItemId, paths);
            List<String> old = item.getCompletedDeliverables();
            if (old != null) {
                for (String p : old) {
                    if (paths.stream().noneMatch(p::equals)) {
                        fileStorageService.deleteByPublicStoragePath(p);
                    }
                }
            }
            item.setCompletedDeliverables(new ArrayList<>(paths));
        } else {
            List<String> old = item.getCompletedDeliverables();
            if (old != null) {
                for (String p : old) {
                    fileStorageService.deleteByPublicStoragePath(p);
                }
            }
            item.setCompletedDeliverables(null);
        }
        orderItemRepo.save(item);
        return getOrderById(item.getOrder().getOrderId());
    }

    private void validateDeliverablePathsForOrderItem(Integer orderItemId, List<String> paths) {
        String prefix = "/storage/orders/deliverables/" + orderItemId + "/";
        for (String p : paths) {
            if (p == null || !p.startsWith(prefix)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid deliverable path for this line item");
            }
        }
    }

    private void touchOrderItemGraph(OrderItem item) {
        if (item == null) {
            return;
        }
        if (item.getOrder() != null) {
            item.getOrder().getOrderId();
        }
        Commission c = item.getCommission();
        if (c != null) {
            c.getCommissionPrice();
            c.getCommissionType();
            if (c.getGenre() != null) {
                c.getGenre().name();
            }
            User seller = c.getUser();
            if (seller != null) {
                seller.getUserId();
                seller.getUsername();
            }
        }
    }

    private void assertArtistOrAdminCanEditDeliverables(OrderItem item) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof Account acc)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        Account caller = accountRepo.findById(acc.getAccountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found"));
        if (acc.getRole() == Role.ADMIN) {
            return;
        }
        if (acc.getRole() != Role.ARTIST) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Artist only");
        }
        if (caller.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User profile required");
        }
        Integer artistUid = caller.getUser().getUserId();
        if (!orderItemBelongsToArtist(item, artistUid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your commission line");
        }
    }

    private static boolean orderItemBelongsToArtist(OrderItem item, Integer artistUserId) {
        if (item == null || artistUserId == null) {
            return false;
        }
        Commission c = item.getCommission();
        return c != null && c.getUser() != null && artistUserId.equals(c.getUser().getUserId());
    }

    /**
     * Đảm bảo lazy associations được nạp trong session (EntityGraph + @Query đôi khi không áp dụng đủ),
     * để {@link com.spring.digiprint.dtos.responses.OrderResponse} đọc được customer / commission.
     */
    private void touchOrderGraph(Order order) {
        if (order == null) {
            return;
        }
        Account c = order.getCustomer();
        if (c != null) {
            c.getEmail();
            User u = c.getUser();
            if (u != null) {
                u.getUsername();
            }
        }
        List<OrderItem> items = order.getOrderItems();
        if (items != null) {
            for (OrderItem i : items) {
                Commission com = i.getCommission();
                if (com != null) {
                    com.getCommissionPrice();
                    com.getCommissionType();
                    if (com.getGenre() != null) {
                        com.getGenre().name();
                    }
                    User seller = com.getUser();
                    if (seller != null) {
                        seller.getUsername();
                        if (seller.getAccount() != null) {
                            seller.getAccount().getEmail();
                        }
                    }
                }
            }
        }
    }

    @Override
    public OrderResponse getOrderById(Integer id) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        touchOrderGraph(order);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof Account acc) {
            if (acc.getRole() == Role.USER) {
                if (order.getCustomer() == null || !acc.getAccountId().equals(order.getCustomer().getAccountId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your order");
                }
            } else if (acc.getRole() == Role.ARTIST) {
                // Artist vừa có thể là seller trên đơn, vừa có thể là khách (đặt commission artist khác).
                boolean isCustomer = order.getCustomer() != null
                        && acc.getAccountId().equals(order.getCustomer().getAccountId());
                if (isCustomer) {
                    // Cho phép xem/sửa draft như USER (My orders → Update).
                } else {
                    Account full = accountRepo.findById(acc.getAccountId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found"));
                    Integer artistUid = full.getUser() != null ? full.getUser().getUserId() : null;
                    if (artistUid == null || !orderContainsLineForArtist(order, artistUid)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your order");
                    }
                }
            }
        }
        return toOrderResponseWithPayment(order);
    }

    /** Đơn có ít nhất một dòng commission thuộc artist (User.userId). */
    private boolean orderContainsLineForArtist(Order order, Integer artistUserId) {
        if (order == null || artistUserId == null) {
            return false;
        }
        List<OrderItem> items = order.getOrderItems();
        if (items == null) {
            return false;
        }
        for (OrderItem i : items) {
            Commission c = i.getCommission();
            if (c != null && c.getUser() != null && artistUserId.equals(c.getUser().getUserId())) {
                return true;
            }
        }
        return false;
    }

    @Override
    public PageResponse<OrderResponse> filterOrders(
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
    ) {
        Double min = priceMin;
        Double max = priceMax;
        if (min != null && max != null && min > max) {
            double t = min;
            min = max;
            max = t;
        }
        LocalDateTime cFrom = createdAtFrom;
        LocalDateTime cTo = createdAtTo;
        if (cFrom != null && cTo != null && cFrom.isAfter(cTo)) {
            LocalDateTime t = cFrom;
            cFrom = cTo;
            cTo = t;
        }
        LocalDateTime compFrom = completedAtFrom;
        LocalDateTime compTo = completedAtTo;
        if (compFrom != null && compTo != null && compFrom.isAfter(compTo)) {
            LocalDateTime t = compFrom;
            compFrom = compTo;
            compTo = t;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof Account acc)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        Integer customerAccountId = null;
        Integer artistUserId = null;
        if (acc.getRole() == Role.USER) {
            customerAccountId = acc.getAccountId();
        } else if (acc.getRole() == Role.ARTIST) {
            Account full = accountRepo.findById(acc.getAccountId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found"));
            boolean wantIncoming = artistOrderMode != null && "incoming".equalsIgnoreCase(artistOrderMode.trim());
            if (wantIncoming) {
                artistUserId = full.getUser() != null ? full.getUser().getUserId() : -1;
            } else {
                customerAccountId = acc.getAccountId();
            }
        }
        // ADMIN: cả hai null → xem mọi đơn

        int safePage = Math.max(0, page);
        int safeSize = size < 1 ? 20 : Math.min(size, 100);
        var pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        String customerQ = customer != null && !customer.isBlank() ? customer.trim() : null;
        String artistQ = artist != null && !artist.isBlank() ? artist.trim() : null;
        var idPage = orderRepo.filterOrderIds(
                status, min, max, customerQ, artistQ, cFrom, cTo, compFrom, compTo, customerAccountId, artistUserId, pageable);

        List<OrderResponse> content;
        if (idPage.isEmpty()) {
            content = List.of();
        } else {
            List<Integer> ids = idPage.getContent();
            List<Order> fetched = orderRepo.findAllWithGraphByOrderIdIn(ids);
            List<Payment> latestPayments = paymentRepo.findLatestByOrderIds(ids);
            Map<Integer, Order> byId = new HashMap<>();
            for (Order o : fetched) {
                byId.put(o.getOrderId(), o);
            }
            Map<Integer, Payment> latestPaymentByOrderId = new HashMap<>();
            for (Payment p : latestPayments) {
                if (p.getOrder() != null && p.getOrder().getOrderId() != null) {
                    latestPaymentByOrderId.put(p.getOrder().getOrderId(), p);
                }
            }
            content = new ArrayList<>();
            for (Integer oid : ids) {
                Order o = byId.get(oid);
                if (o != null) {
                    touchOrderGraph(o);
                    OrderResponse rs = new OrderResponse(o);
                    Payment lp = latestPaymentByOrderId.get(oid);
                    if (lp != null) {
                        rs.setPaymentStatus(lp.getPaymentStatus());
                    }
                    content.add(rs);
                }
            }
        }

        PageResponse<OrderResponse> rs = new PageResponse<>();
        rs.setContent(content);
        rs.setPage(idPage.getNumber());
        rs.setSize(idPage.getSize());
        rs.setTotalElements(idPage.getTotalElements());
        rs.setTotalPages(idPage.getTotalPages());
        return rs;
    }

    @Override
    public OrderResponse updateOrderStatus(Integer id, OrderStatus newStatus) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        touchOrderGraph(order);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof Account acc)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }

        Account caller = accountRepo.findById(acc.getAccountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found"));

        boolean isCustomer = order.getCustomer() != null
                && caller.getAccountId().equals(order.getCustomer().getAccountId());
        boolean isArtistSeller = false;
        if (acc.getRole() == Role.ARTIST && caller.getUser() != null) {
            Integer artistUid = caller.getUser().getUserId();
            isArtistSeller = orderContainsLineForArtist(order, artistUid);
        }
        boolean isAdmin = acc.getRole() == Role.ADMIN;

        OrderStatus current = order.getOrderStatus();

        if (isAdmin) {
            assertValidAdminTransition(current, newStatus);
        } else if (isCustomer && isArtistSeller) {
            // Cùng account vừa là khách vừa là seller trên đơn: chọn rule theo loại transition.
            if (matchesArtistTransition(current, newStatus)) {
                assertValidArtistTransition(current, newStatus);
            } else if (matchesCustomerTransition(current, newStatus)) {
                assertValidCustomerTransition(current, newStatus);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status transition");
            }
        } else if (isCustomer) {
            assertValidCustomerTransition(current, newStatus);
        } else if (isArtistSeller) {
            assertValidArtistTransition(current, newStatus);
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to update this order");
        }

        if (newStatus == OrderStatus.COMPLETED) {
            assertEveryOrderItemHasCompletedDeliverables(order);
        }

        order.setOrderStatus(newStatus);
        if (newStatus == OrderStatus.COMPLETED) {
            order.setCompletedAt(java.time.LocalDateTime.now());
        }

        Order saved = orderRepo.save(order);
        touchOrderGraph(saved);
        return toOrderResponseWithPayment(saved);
    }

    private OrderResponse toOrderResponseWithPayment(Order order) {
        OrderResponse rs = new OrderResponse(order);
        paymentRepo.findTopByOrder_OrderIdOrderByCreatedAtDesc(order.getOrderId())
                .map(Payment::getPaymentStatus)
                .ifPresent(rs::setPaymentStatus);
        return rs;
    }

    private static void assertNotSelfOrder(Integer customerUserId, Commission commission) {
        if (customerUserId == null || commission == null || commission.getUser() == null) {
            return;
        }
        if (customerUserId.equals(commission.getUser().getUserId())) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                    "Artist cannot order their own commission"
            );
        }
    }

    /**
     * Hoàn thành đơn chỉ khi mọi dòng commission đã có ít nhất một file delivered (artist upload).
     */
    private static void assertEveryOrderItemHasCompletedDeliverables(Order order) {
        List<OrderItem> items = order.getOrderItems();
        if (items == null || items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order has no commission items");
        }
        for (OrderItem oi : items) {
            List<String> d = oi.getCompletedDeliverables();
            if (d == null || d.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Each commission item must have at least one delivered file before the order can be completed.");
            }
        }
    }

    /** Customer: PENDING → DRAFT (edit) or CANCELLED */
    private static boolean matchesCustomerTransition(OrderStatus current, OrderStatus target) {
        return current == OrderStatus.PENDING
                && (target == OrderStatus.DRAFT || target == OrderStatus.CANCELLED);
    }

    private static void assertValidCustomerTransition(OrderStatus current, OrderStatus target) {
        if (matchesCustomerTransition(current, target)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status transition for customer");
    }

    /** Artist (commission lines): PENDING → ACCEPTED/REJECTED, ACCEPTED → IN_PROGRESS, IN_PROGRESS → CANCELLED/COMPLETED */
    private static boolean matchesArtistTransition(OrderStatus current, OrderStatus target) {
        if (current == OrderStatus.PENDING
                && (target == OrderStatus.ACCEPTED || target == OrderStatus.REJECTED)) {
            return true;
        }
        if (current == OrderStatus.ACCEPTED && target == OrderStatus.IN_PROGRESS) {
            return true;
        }
        return current == OrderStatus.IN_PROGRESS
                && (target == OrderStatus.CANCELLED || target == OrderStatus.COMPLETED);
    }

    private static void assertValidArtistTransition(OrderStatus current, OrderStatus target) {
        if (matchesArtistTransition(current, target)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status transition for artist");
    }

    /** Admin: union of customer + artist transitions for moderation */
    private static void assertValidAdminTransition(OrderStatus current, OrderStatus target) {
        if (current == OrderStatus.PENDING
                && (target == OrderStatus.DRAFT
                        || target == OrderStatus.CANCELLED
                        || target == OrderStatus.ACCEPTED
                        || target == OrderStatus.REJECTED)) {
            return;
        }
        if (current == OrderStatus.ACCEPTED && target == OrderStatus.IN_PROGRESS) {
            return;
        }
        if (current == OrderStatus.IN_PROGRESS
                && (target == OrderStatus.CANCELLED || target == OrderStatus.COMPLETED)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status transition");
    }
}

