package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.requests.ChangePasswordRequest;
import com.spring.digiprint.dtos.responses.AccountResponse;
import com.spring.digiprint.entities.Account;
import com.spring.digiprint.repositories.AccountRepository;
import com.spring.digiprint.services.AccountService;
import com.spring.digiprint.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RequiredArgsConstructor
@Service
public class AccountServiceImpl implements AccountService {
    private final AccountRepository accountRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String loginIdentifier) throws UsernameNotFoundException {
        return accountRepo.findByEmailOrUserUsername(loginIdentifier, loginIdentifier)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Override
    public List<AccountResponse> getAllAccounts() {
        return accountRepo.findAll()
                .stream()
                .map(AccountResponse::new)
                .toList();
    }

    public AccountResponse getAccountById(Integer id) {
        return accountRepo.findById(id).map(AccountResponse::new)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
    }

    public void changePassword(ChangePasswordRequest request) {
        Integer id = SecurityUtil.getCurrentUserId();

        Account a = accountRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), a.getPassword())) throw new RuntimeException("Current password is incorrect");

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password and confirmation do not match");
        }

        a.setPassword(passwordEncoder.encode(request.getNewPassword()));
        a.setPasswordLength(request.getNewPassword().length());

        accountRepo.save(a);
    }

}
