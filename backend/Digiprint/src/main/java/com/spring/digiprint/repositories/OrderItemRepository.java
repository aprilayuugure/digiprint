package com.spring.digiprint.repositories;

import com.spring.digiprint.entities.OrderItem;
import com.spring.digiprint.enums.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    boolean existsByCommission_CommissionIdAndOrder_OrderStatusNot(Integer commissionId, OrderStatus status);

    @EntityGraph(attributePaths = {"order", "commission", "commission.user"})
    @Query("SELECT oi FROM OrderItem oi WHERE oi.orderItemId = :id")
    Optional<OrderItem> findByIdWithOrderAndCommission(@Param("id") Integer id);
}

