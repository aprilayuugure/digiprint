package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.Account;
import com.spring.digiprint.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RegisterResponse {
    private Integer accountId;
    private String email;
    private Role role;
    private Integer userId;

    public static RegisterResponse from(Account a) {
        Integer uid = null;
        if (a.getUser() != null) {
            uid = a.getUser().getUserId();
        }
        return new RegisterResponse(a.getAccountId(), a.getEmail(), a.getRole(), uid);
    }
}
