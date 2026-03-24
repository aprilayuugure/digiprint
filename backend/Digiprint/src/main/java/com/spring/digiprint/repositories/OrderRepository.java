package com.spring.digiprint.repositories;

import com.spring.digiprint.entities.Order;
import com.spring.digiprint.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    long countByOrderStatus(OrderStatus status);


    @EntityGraph(
            attributePaths = {
                    "customer",
                    "customer.user",
                    "orderItems",
                    "orderItems.commission",
                    "orderItems.commission.user",
                    "orderItems.commission.user.account",
            }
    )
    @Override
    Optional<Order> findById(Integer id);

    String FILTER_WHERE = """
            (:status IS NULL OR o.orderStatus = :status)
            AND (:priceMin IS NULL OR o.price >= :priceMin)
            AND (:priceMax IS NULL OR o.price <= :priceMax)
            AND (:createdAtFrom IS NULL OR o.createdAt >= :createdAtFrom)
            AND (:createdAtTo IS NULL OR o.createdAt <= :createdAtTo)
            AND (:completedAtFrom IS NULL OR (o.completedAt IS NOT NULL AND o.completedAt >= :completedAtFrom))
            AND (:completedAtTo IS NULL OR (o.completedAt IS NOT NULL AND o.completedAt <= :completedAtTo))
            AND (:customer IS NULL OR (
                 o.customer IS NOT NULL AND o.customer.user IS NOT NULL
                 AND LOWER(o.customer.user.username) LIKE LOWER(CONCAT('%', :customer, '%'))
            ))
            AND (:artist IS NULL OR EXISTS (
                SELECT 1 FROM OrderItem oiA
                INNER JOIN oiA.commission comA
                INNER JOIN comA.user usrA
                WHERE oiA.order = o
                  AND LOWER(usrA.username) LIKE LOWER(CONCAT('%', :artist, '%'))
            ))
            AND (:customerAccountId IS NULL OR (o.customer IS NOT NULL AND o.customer.accountId = :customerAccountId))
            AND (:artistUserId IS NULL OR EXISTS (
                SELECT 1 FROM OrderItem oiF
                INNER JOIN oiF.commission comF
                INNER JOIN comF.user usrF
                WHERE oiF.order = o AND usrF.userId = :artistUserId
            ))
            """;

    @EntityGraph(
            attributePaths = {
                    "customer",
                    "customer.user",
            }
    )
    @Query(
            value = "SELECT o FROM Order o WHERE " + FILTER_WHERE,
            countQuery = "SELECT count(o) FROM Order o WHERE " + FILTER_WHERE
    )
    Page<Order> filterOrders(
            @Param("status") OrderStatus status,
            @Param("priceMin") Double priceMin,
            @Param("priceMax") Double priceMax,
            @Param("customer") String customer,
            @Param("artist") String artist,
            @Param("createdAtFrom") LocalDateTime createdAtFrom,
            @Param("createdAtTo") LocalDateTime createdAtTo,
            @Param("completedAtFrom") LocalDateTime completedAtFrom,
            @Param("completedAtTo") LocalDateTime completedAtTo,
            @Param("customerAccountId") Integer customerAccountId,
            @Param("artistUserId") Integer artistUserId,
            Pageable pageable
    );

    @Query(
            value = "SELECT o.orderId FROM Order o WHERE " + FILTER_WHERE,
            countQuery = "SELECT count(o) FROM Order o WHERE " + FILTER_WHERE
    )
    Page<Integer> filterOrderIds(
            @Param("status") OrderStatus status,
            @Param("priceMin") Double priceMin,
            @Param("priceMax") Double priceMax,
            @Param("customer") String customer,
            @Param("artist") String artist,
            @Param("createdAtFrom") LocalDateTime createdAtFrom,
            @Param("createdAtTo") LocalDateTime createdAtTo,
            @Param("completedAtFrom") LocalDateTime completedAtFrom,
            @Param("completedAtTo") LocalDateTime completedAtTo,
            @Param("customerAccountId") Integer customerAccountId,
            @Param("artistUserId") Integer artistUserId,
            Pageable pageable
    );

    @EntityGraph(
            attributePaths = {
                    "customer",
                    "customer.user",
                    "orderItems",
                    "orderItems.commission",
                    "orderItems.commission.user",
                    "orderItems.commission.user.account",
            }
    )
    @Query("SELECT DISTINCT o FROM Order o WHERE o.orderId IN :ids")
    List<Order> findAllWithGraphByOrderIdIn(@Param("ids") List<Integer> ids);

    /**
     * Doanh thu từ các dòng commission của artist trong đơn COMPLETED, theo khoảng completed_at.
     */
    @Query(
            value = """
                    SELECT COALESCE(SUM(CAST(oi.quantity AS FLOAT) * CAST(c.commission_price AS FLOAT)), 0)
                    FROM order_items oi
                    INNER JOIN [orders] o ON o.order_id = oi.order_id
                    INNER JOIN commissions c ON c.commission_id = oi.commission_id
                    WHERE c.user_id = :artistUserId
                      AND o.order_status = 'COMPLETED'
                      AND o.completed_at IS NOT NULL
                      AND o.completed_at >= :start
                      AND o.completed_at < :end
                    """,
            nativeQuery = true
    )
    Double sumCompletedRevenueBetween(
            @Param("artistUserId") Integer artistUserId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * Doanh thu theo tháng (năm/tháng của completed_at), đơn COMPLETED.
     */
    @Query(
            value = """
                    SELECT YEAR(o.completed_at),
                           MONTH(o.completed_at),
                           COALESCE(SUM(CAST(oi.quantity AS FLOAT) * CAST(c.commission_price AS FLOAT)), 0)
                    FROM order_items oi
                    INNER JOIN [orders] o ON o.order_id = oi.order_id
                    INNER JOIN commissions c ON c.commission_id = oi.commission_id
                    WHERE c.user_id = :artistUserId
                      AND o.order_status = 'COMPLETED'
                      AND o.completed_at IS NOT NULL
                      AND o.completed_at >= :from
                    GROUP BY YEAR(o.completed_at), MONTH(o.completed_at)
                    """,
            nativeQuery = true
    )
    List<Object[]> sumRevenueByCompletedMonth(
            @Param("artistUserId") Integer artistUserId, @Param("from") LocalDateTime from);

    /**
     * Số đơn (distinct) có ít nhất một dòng commission của artist, trạng thái cho trước.
     */
    @Query(
            value = """
                    SELECT COUNT(DISTINCT o.order_id)
                    FROM [orders] o
                    INNER JOIN order_items oi ON o.order_id = oi.order_id
                    INNER JOIN commissions c ON c.commission_id = oi.commission_id
                    WHERE c.user_id = :artistUserId
                      AND o.order_status = :status
                    """,
            nativeQuery = true
    )
    long countDistinctOrdersForArtistWithStatus(
            @Param("artistUserId") Integer artistUserId, @Param("status") String status);
}

