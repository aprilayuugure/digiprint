package com.spring.digiprint.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Embeddable
public class FollowId implements Serializable {

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "artist_id")
    private Integer artistId;
}

