package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.User;
import com.spring.digiprint.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AdminUserRowResponse {
    private Integer userId;
    private String email;
    private String username;
    private Role role;

    public AdminUserRowResponse(User user) {
        this.userId = user.getUserId();
        this.email = user.getAccount() != null ? user.getAccount().getEmail() : null;
        this.username = user.getUsername();
        this.role = user.getAccount() != null ? user.getAccount().getRole() : null;
    }
}
