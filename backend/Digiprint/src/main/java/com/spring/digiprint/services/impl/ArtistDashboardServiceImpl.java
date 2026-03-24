package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.responses.ArtistDashboardResponse;
import com.spring.digiprint.entities.*;
import com.spring.digiprint.enums.*;
import com.spring.digiprint.repositories.*;
import com.spring.digiprint.services.ArtistDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ArtistDashboardServiceImpl implements ArtistDashboardService {

    private static final DateTimeFormatter MONTH_LABEL =
            DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);

    private final FollowRepository followRepository;
    private final WorkRepository workRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public ArtistDashboardResponse getDashboardForCurrentArtist() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof Account acc)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        if (acc.getRole() != Role.ARTIST) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Artist only");
        }

        User user = userRepository.findByAccount_AccountId(acc.getAccountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Integer uid = user.getUserId();

        long followerCount = followRepository.countByArtist_UserId(uid);
        long worksCount = workRepository.countByUser_UserId(uid);
        List<ArtistDashboardResponse.WorksByGenreStat> worksByGenre = new ArrayList<>();
        for (Genre g : Genre.values()) {
            long c = workRepository.countByUser_UserIdAndGenre(uid, g);
            worksByGenre.add(new ArtistDashboardResponse.WorksByGenreStat(g.name(), c));
        }
        long ordersCompletedCount =
                orderRepository.countDistinctOrdersForArtistWithStatus(uid, "COMPLETED");
        long ordersInProgressCount =
                orderRepository.countDistinctOrdersForArtistWithStatus(uid, "IN_PROGRESS");

        YearMonth ymNow = YearMonth.now();
        LocalDateTime monthStart = ymNow.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = ymNow.plusMonths(1).atDay(1).atStartOfDay();

        Double earningRaw = orderRepository.sumCompletedRevenueBetween(uid, monthStart, monthEnd);
        double earningThisMonth = earningRaw != null ? earningRaw : 0.0;

        YearMonth startYm = ymNow.minusMonths(11);
        LocalDateTime from12 = startYm.atDay(1).atStartOfDay();

        Map<YearMonth, Long> worksByMonth = new HashMap<>();
        for (Object[] row : workRepository.countWorksUploadedByMonth(uid, from12)) {
            int y = ((Number) row[0]).intValue();
            int m = ((Number) row[1]).intValue();
            long cnt = ((Number) row[2]).longValue();
            worksByMonth.put(YearMonth.of(y, m), cnt);
        }

        Map<YearMonth, Double> revenueByMonth = new HashMap<>();
        for (Object[] row : orderRepository.sumRevenueByCompletedMonth(uid, from12)) {
            int y = ((Number) row[0]).intValue();
            int m = ((Number) row[1]).intValue();
            double rev = ((Number) row[2]).doubleValue();
            revenueByMonth.put(YearMonth.of(y, m), rev);
        }

        List<ArtistDashboardResponse.MonthlyArtistStat> monthlyStats = new ArrayList<>();
        for (YearMonth cursor = startYm; !cursor.isAfter(ymNow); cursor = cursor.plusMonths(1)) {
            long w = worksByMonth.getOrDefault(cursor, 0L);
            double r = revenueByMonth.getOrDefault(cursor, 0.0);
            LocalDateTime labelDate = cursor.atDay(1).atStartOfDay();
            String label = MONTH_LABEL.format(labelDate);
            monthlyStats.add(new ArtistDashboardResponse.MonthlyArtistStat(
                    cursor.getYear(),
                    cursor.getMonthValue(),
                    label,
                    w,
                    r
            ));
        }

        return new ArtistDashboardResponse(
                followerCount,
                worksCount,
                worksByGenre,
                ordersCompletedCount,
                ordersInProgressCount,
                earningThisMonth,
                monthlyStats);
    }
}
