package com.spring.digiprint.repositories;

import com.spring.digiprint.entities.Payment;
import com.spring.digiprint.enums.PaymentStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findByTxnRef(String txnRef);
    long countByPaymentStatus(PaymentStatus status);

    Optional<Payment> findTopByOrder_OrderIdOrderByCreatedAtDesc(Integer orderId);

    @Query("""
            SELECT p FROM Payment p
            WHERE p.order.orderId IN :orderIds
              AND p.createdAt = (
                SELECT MAX(p2.createdAt) FROM Payment p2 WHERE p2.order.orderId = p.order.orderId
              )
            """)
    List<Payment> findLatestByOrderIds(@Param("orderIds") List<Integer> orderIds);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentStatus = :status")
    Long sumAmountByPaymentStatus(@Param("status") PaymentStatus status);
}
