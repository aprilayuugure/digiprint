package com.spring.digiprint.dtos.responses;

import java.util.List;

/**
 * Thống kê dashboard cho nghệ sĩ: followers, works theo genre, đơn commission,
 * doanh thu tháng này, và chuỗi theo tháng (upload + doanh thu đơn hoàn thành).
 */
public record ArtistDashboardResponse(
        long followerCount,
        /** Tổng work đã đăng. */
        long worksCount,
        /** Số work theo từng genre (ART, MUSIC, LITERATURE). */
        List<WorksByGenreStat> worksByGenre,
        long ordersCompletedCount,
        long ordersInProgressCount,
        double earningThisMonth,
        List<MonthlyArtistStat> monthlyStats
) {
    public record WorksByGenreStat(String genre, long count) {}

    public record MonthlyArtistStat(
            int year,
            int month,
            String label,
            long worksUploaded,
            double revenue
    ) {}
}
