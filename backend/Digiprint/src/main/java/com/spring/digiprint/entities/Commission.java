package com.spring.digiprint.entities;

import com.spring.digiprint.enums.Genre;
import jakarta.persistence.*;
import lombok.*;

import java.util.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "commissions")
public class Commission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "commission_id")
    private Integer commissionId;

    @Column(name = "commission_type")
    private String commissionType;

    @Column(name = "commission_description")
    private String commissionDescription;

    @Column(name = "commission_price")
    private int commissionPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "genre")
    private Genre genre;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "commission", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<Sample> attachments = new ArrayList<>();
}
