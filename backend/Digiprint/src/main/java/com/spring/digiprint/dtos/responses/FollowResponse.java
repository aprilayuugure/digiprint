package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class FollowResponse {

    private Integer userId;

    private String avatar;

    private String username;

    public FollowResponse(User u) {
        this.userId = u.getUserId();
        this.avatar = u.getImage();
        this.username = u.getUsername();
    }
}

