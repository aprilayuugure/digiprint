package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.responses.AdminDashboardResponse;
import com.spring.digiprint.entities.Account;
import com.spring.digiprint.enums.ArtistApplicationStatus;
import com.spring.digiprint.enums.OrderStatus;
import com.spring.digiprint.enums.PaymentStatus;
import com.spring.digiprint.enums.Role;
import com.spring.digiprint.repositories.AccountRepository;
import com.spring.digiprint.repositories.ArtistApplicationRepository;
import com.spring.digiprint.repositories.OrderRepository;
import com.spring.digiprint.repositories.PaymentRepository;
import com.spring.digiprint.repositories.WorkRepository;
import com.spring.digiprint.services.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final AccountRepository accountRepository;
    private final WorkRepository workRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ArtistApplicationRepository artistApplicationRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboardForCurrentAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof Account acc)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        if (acc.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }

        long totalUsers = accountRepository.countByRole(Role.USER);
        long totalArtists = accountRepository.countByRole(Role.ARTIST);
        long totalWorks = workRepository.count();
        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByOrderStatus(OrderStatus.PENDING);
        long inProgressOrders = orderRepository.countByOrderStatus(OrderStatus.IN_PROGRESS);
        long completedOrders = orderRepository.countByOrderStatus(OrderStatus.COMPLETED);

        long successfulPayments = paymentRepository.countByPaymentStatus(PaymentStatus.SUCCESS);
        long failedPayments = paymentRepository.countByPaymentStatus(PaymentStatus.FAILED);
        long pendingPayments = paymentRepository.countByPaymentStatus(PaymentStatus.PENDING);
        long pendingArtistApplications = artistApplicationRepository.countByStatus(ArtistApplicationStatus.PENDING);
        long totalSuccessfulPaymentAmount = paymentRepository.sumAmountByPaymentStatus(PaymentStatus.SUCCESS);

        return new AdminDashboardResponse(
                totalUsers,
                totalArtists,
                totalWorks,
                totalOrders,
                pendingOrders,
                inProgressOrders,
                completedOrders,
                successfulPayments,
                failedPayments,
                pendingPayments,
                pendingArtistApplications,
                totalSuccessfulPaymentAmount
        );
    }
}
