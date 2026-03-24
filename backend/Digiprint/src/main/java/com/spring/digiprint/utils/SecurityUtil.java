package com.spring.digiprint.utils;

import com.spring.digiprint.entities.Account;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtil {
    public static Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) throw new RuntimeException("User not authenticated");

        Account a = (Account) auth.getPrincipal();

        return a.getAccountId();
    }
}
