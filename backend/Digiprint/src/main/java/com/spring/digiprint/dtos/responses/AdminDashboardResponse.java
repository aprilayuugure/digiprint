package com.spring.digiprint.dtos.responses;

/**
 * Tổng quan hệ thống cho admin dashboard.
 */
public record AdminDashboardResponse(
        long totalUsers,
        long totalArtists,
        long totalWorks,
        long totalOrders,
        long pendingOrders,
        long inProgressOrders,
        long completedOrders,
        long successfulPayments,
        long failedPayments,
        long pendingPayments,
        long pendingArtistApplications,
        long totalSuccessfulPaymentAmount
) {}
