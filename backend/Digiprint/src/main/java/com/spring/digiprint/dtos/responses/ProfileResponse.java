package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.User;
import com.spring.digiprint.enums.Gender;
import lombok.*;

import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ProfileResponse {
    private Integer userId;

    private Integer accountId;

    private String backgroundImage;

    private String image;

    private String username;

    private String firstName;

    private String lastName;

    private LocalDate dateOfBirth;

    private Gender gender;

    private String location;

    private String biography;

    /** Account role (USER, ARTIST, ADMIN); null if no linked account. */
    private String role;

    /** Độ dài mật khẩu (để hiển thị dấu •); null nếu tài khoản cũ. */
    private Integer passwordLength;

    public ProfileResponse(User u) {
        this.userId = u.getUserId();
        this.accountId = u.getAccount() != null ? u.getAccount().getAccountId() : null;
        this.backgroundImage = u.getBackgroundImage();
        this.image = u.getImage();
        this.username = u.getUsername();
        this.firstName = u.getFirstName();
        this.lastName = u.getLastName();
        this.dateOfBirth = u.getDateOfBirth();
        this.gender = u.getGender();
        this.location = u.getLocation();
        this.biography = u.getBiography();
        this.role = u.getAccount() != null && u.getAccount().getRole() != null
                ? u.getAccount().getRole().name()
                : null;
        this.passwordLength = u.getAccount() != null ? u.getAccount().getPasswordLength() : null;
    }
}
 