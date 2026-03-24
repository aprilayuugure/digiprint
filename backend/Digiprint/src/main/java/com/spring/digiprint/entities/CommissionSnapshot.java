package com.spring.digiprint.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CommissionSnapshot {

    @Column(name = "commission_type_snapshot", length = 255)
    private String commissionType;

    @Column(name = "genre_snapshot", length = 50)
    private String genre;

    @Column(name = "unit_price_snapshot")
    private Integer unitPrice;
}
