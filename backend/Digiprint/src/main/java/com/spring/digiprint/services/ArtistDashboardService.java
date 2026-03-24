package com.spring.digiprint.services;

import com.spring.digiprint.dtos.responses.ArtistDashboardResponse;

public interface ArtistDashboardService {

    ArtistDashboardResponse getDashboardForCurrentArtist();
}
