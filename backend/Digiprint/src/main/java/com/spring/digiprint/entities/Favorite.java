package com.spring.digiprint.entities;

import jakarta.persistence.*;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "favorites")
public class Favorite {
    @EmbeddedId
    private FavoriteId id = new FavoriteId();

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @MapsId("workId")
    @JoinColumn(name = "work_id")
    private Work work;
}
