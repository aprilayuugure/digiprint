package com.spring.digiprint.services;

import com.spring.digiprint.dtos.requests.ChangePasswordRequest;
import com.spring.digiprint.dtos.responses.AccountResponse;
import org.springframework.security.core.userdetails.UserDetailsService;
import java.util.List;

public interface AccountService extends UserDetailsService {
    public List<AccountResponse> getAllAccounts();

    public AccountResponse getAccountById(Integer id);

    public void changePassword(ChangePasswordRequest request);
}
