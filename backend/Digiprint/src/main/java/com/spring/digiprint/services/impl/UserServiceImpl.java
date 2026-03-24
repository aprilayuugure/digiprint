package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.requests.ProfileRequest;
import com.spring.digiprint.dtos.requests.UpdateUsernameRequest;
import com.spring.digiprint.dtos.responses.AdminUserRowResponse;
import com.spring.digiprint.dtos.responses.CreatorSuggestionResponse;
import com.spring.digiprint.dtos.responses.ProfileResponse;
import com.spring.digiprint.entities.User;
import com.spring.digiprint.enums.UserMediaType;
import com.spring.digiprint.repositories.UserRepository;
import com.spring.digiprint.services.FileStorageService;
import com.spring.digiprint.services.UserService;
import com.spring.digiprint.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepo;

    private final FileStorageService fileStorageService;

    @Override
    public ProfileResponse getProfileById(Integer id) {
        return userRepo.findById(id).map(ProfileResponse::new)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
    }

    @Override
    public ProfileResponse getMyProfile() {
        Integer id = SecurityUtil.getCurrentUserId();

        User u = userRepo.findByAccount_AccountId(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new ProfileResponse(u);
    }

    @Override
    public ProfileResponse updateMyProfile(ProfileRequest request) {
        Integer id = SecurityUtil.getCurrentUserId();

        User u = userRepo.findByAccount_AccountId(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            if (request.getBackgroundImage() != null && !request.getBackgroundImage().isEmpty()) {
                String backgroundImage = fileStorageService.saveUserFile(
                        request.getBackgroundImage(), UserMediaType.BACKGROUND, u.getUserId()
                );

                u.setBackgroundImage(backgroundImage);
            }

            if (request.getImage() != null && !request.getImage().isEmpty()) {
                String image = fileStorageService.saveUserFile(
                        request.getImage(), UserMediaType.AVATAR, u.getUserId()
                );

                u.setImage(image);
            }
        }
        catch (IOException e) {
            throw new RuntimeException("File upload failed");
        }

        u.setUsername(request.getUsername());
        u.setFirstName(request.getFirstName());
        u.setLastName(request.getLastName());
        u.setDateOfBirth(request.getDateOfBirth());
        u.setGender(request.getGender());
        u.setLocation(request.getLocation());
        u.setBiography(request.getBiography());

        return new ProfileResponse(userRepo.save(u));
    }

    @Override
    public ProfileResponse updateMyUsername(UpdateUsernameRequest request) {
        Integer accountId = SecurityUtil.getCurrentUserId();

        User u = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newUsername = request.getUsername().trim();
        if (newUsername.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username cannot be empty");
        }

        if (newUsername.equals(u.getUsername())) {
            return new ProfileResponse(u);
        }

        Optional<User> existing = userRepo.findByUsername(newUsername);
        if (existing.isPresent() && !existing.get().getUserId().equals(u.getUserId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        u.setUsername(newUsername);
        return new ProfileResponse(userRepo.save(u));
    }

    @Override
    public List<CreatorSuggestionResponse> searchUsers(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return userRepo.findUsersByUsernameContainingIgnoreCase(query.trim(), PageRequest.of(0, 10))
                .stream()
                .map(CreatorSuggestionResponse::new)
                .toList();
    }

    @Override
    public ProfileResponse getProfileByUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new RuntimeException("Username is required");
        }

        User u = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new ProfileResponse(u);
    }

    @Override
    public List<AdminUserRowResponse> getAdminUsers() {
        return userRepo.findAll().stream()
                .map(AdminUserRowResponse::new)
                .toList();
    }
}
