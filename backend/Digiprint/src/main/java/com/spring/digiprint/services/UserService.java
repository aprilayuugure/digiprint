package com.spring.digiprint.services;

import com.spring.digiprint.dtos.requests.ProfileRequest;
import com.spring.digiprint.dtos.requests.UpdateUsernameRequest;
import com.spring.digiprint.dtos.responses.AdminUserRowResponse;
import com.spring.digiprint.dtos.responses.CreatorSuggestionResponse;
import com.spring.digiprint.dtos.responses.ProfileResponse;

import java.util.List;

public interface UserService {

    ProfileResponse getProfileById(Integer id);

    ProfileResponse getMyProfile();

    ProfileResponse updateMyProfile(ProfileRequest request);

    ProfileResponse updateMyUsername(UpdateUsernameRequest request);

    List<CreatorSuggestionResponse> searchUsers(String query);

    ProfileResponse getProfileByUsername(String username);

    List<AdminUserRowResponse> getAdminUsers();
}
