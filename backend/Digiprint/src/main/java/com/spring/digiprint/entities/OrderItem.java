package com.spring.digiprint.entities;

import com.spring.digiprint.converters.StringListJsonConverter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "order_items")
public class OrderItem implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Integer orderItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commission_id", nullable = false)
    // If OrderItem ever gets serialized directly, this can form loops:
    // Order -> orderItems -> commission -> ... -> order -> ...
    // so we skip this back-reference at the JSON layer.
    @JsonIgnore
    private Commission commission;

    /** Snapshot commission tại thời điểm đặt đơn/chỉnh draft. */
    @Embedded
    private CommissionSnapshot commissionSnapshot;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "order_description", columnDefinition = "NVARCHAR(MAX)")
    private String orderDescription;

    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "attached_images", columnDefinition = "NVARCHAR(MAX)")
    private List<String> attachedImages;

    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "completed_deliverables", columnDefinition = "NVARCHAR(MAX)")
    private List<String> completedDeliverables;
}
