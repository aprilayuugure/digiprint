package com.spring.digiprint.services;

import com.spring.digiprint.dtos.requests.*;
import com.spring.digiprint.dtos.responses.LoginResponse;
import com.spring.digiprint.dtos.responses.RegisterResponse;
import com.spring.digiprint.entities.*;
import com.spring.digiprint.enums.Role;
import com.spring.digiprint.repositories.AccountRepository;
import com.spring.digiprint.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@RequiredArgsConstructor
@Service
public class AuthenticationService {
    private final AccountRepository accountRepo;

    private final UserRepository userRepo;

    private final PasswordEncoder passwordEncoder;

    private final AuthenticationManager authManager;

    private final JwtService jwtService;

    public RegisterResponse register(RegisterRequest request) {
        if (request.getRole() == Role.ADMIN) throw new RuntimeException("Cannot register admin account");

        Account a = new Account();

        a.setEmail(request.getEmail());
        a.setPassword(passwordEncoder.encode(request.getPassword()));
        a.setPasswordLength(request.getPassword() != null ? request.getPassword().length() : null);
        a.setRole(request.getRole());

        User u = new User();
        u.setAccount(a);
        a.setUser(u);

        Account saved = accountRepo.save(a);
        return RegisterResponse.from(saved);
    }

    public LoginResponse authenticate(LoginRequest request) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmailOrUsername(), request.getPassword())
        );

        Account a = (Account) auth.getPrincipal();

        String token = jwtService.generateToken(a);
        Long expiresIn = jwtService.getExpirationTime();

        Optional<User> profile = userRepo.findByAccount_AccountId(a.getAccountId());
        String profileImage = profile.map(User::getImage).orElse(null);
        String profileUsername = profile.map(User::getUsername).orElse(null);
        Integer profileUserId = profile.map(User::getUserId).orElse(null);

        return new LoginResponse(token, expiresIn, a, profileImage, profileUsername, profileUserId);
    }

    public String logout() {
        SecurityContextHolder.clearContext();

        return "Logout succeeded";
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail();
        String newPassword = request.getNewPassword();

        accountRepo.findByEmailOrUserUsername(email, email)
                .ifPresentOrElse(account -> {
                            account.setPassword(passwordEncoder.encode(newPassword));
                            account.setPasswordLength(newPassword != null ? newPassword.length() : null);
                            accountRepo.save(account);
                        },
                        () -> {
                            throw new RuntimeException("Account not found");
                        });

        return "Password has been reset successfully";
    }
}
