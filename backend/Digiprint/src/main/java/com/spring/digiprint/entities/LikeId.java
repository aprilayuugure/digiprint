package com.spring.digiprint.entities;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Embeddable
public class LikeId implements Serializable {
    private Integer userId;

    private Integer workId;
}
