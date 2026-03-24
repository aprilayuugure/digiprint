package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.Commission;
import com.spring.digiprint.entities.Sample;
import com.spring.digiprint.enums.Genre;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Comparator;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CommissionResponse {

    private Integer commissionId;

    private String commissionType;

    private int commissionPrice;

    private String commissionDescription;

    private Genre genre;

    private Integer userId;

    private List<String> attachedFiles;

    public CommissionResponse(Commission c) {
        this.commissionId = c.getCommissionId();
        this.commissionType = c.getCommissionType();
        this.commissionPrice = c.getCommissionPrice();
        this.commissionDescription = c.getCommissionDescription();
        this.genre = c.getGenre();
        this.userId = c.getUser() != null ? c.getUser().getUserId() : null;
        this.attachedFiles = c.getAttachments() == null || c.getAttachments().isEmpty()
                ? List.of()
                : c.getAttachments().stream()
                .sorted(Comparator.comparingInt(Sample::getSortOrder))
                .map(Sample::getStoragePath)
                .toList();
    }
}

