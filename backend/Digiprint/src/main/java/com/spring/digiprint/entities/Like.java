package com.spring.digiprint.entities;

import jakarta.persistence.*;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "likes")
public class Like {
    @EmbeddedId
    private LikeId id = new LikeId();

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @MapsId("workId")
    @JoinColumn(name = "work_id")
    private Work work;
}
