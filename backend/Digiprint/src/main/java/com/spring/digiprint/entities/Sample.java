package com.spring.digiprint.entities;

import jakarta.persistence.*;
import lombok.*;

/** File đính kèm commission; path dạng {@code /storage/commissions/{commissionId}/filename}. */
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "commission_attachments")
public class Sample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "commission_attachment_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "commission_id", nullable = false)
    private Commission commission;

    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
