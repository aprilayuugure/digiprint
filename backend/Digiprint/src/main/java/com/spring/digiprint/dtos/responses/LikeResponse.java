package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.User;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class LikeResponse {
    private Integer userId;

    private String avatar;

    private String username;

    public LikeResponse(User u) {
        this.userId = u.getUserId();
        this.avatar = u.getImage();
        this.username = u.getUsername();
    }
}
