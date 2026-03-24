package com.spring.digiprint.entities;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Embeddable
public class WorkTagId implements Serializable {
    private Integer workId;

    private Integer tagId;
}
