package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.Account;
import com.spring.digiprint.enums.Role;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class AccountResponse {
    private String email;

    private Role role;

    public AccountResponse(Account a) {
        this.email = a.getEmail();
        this.role = a.getRole();
    }
}
