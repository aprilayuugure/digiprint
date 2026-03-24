package com.spring.digiprint.services;

import com.spring.digiprint.dtos.responses.AdminDashboardResponse;

public interface AdminDashboardService {
    AdminDashboardResponse getDashboardForCurrentAdmin();
}
