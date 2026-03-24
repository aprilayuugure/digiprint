package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.User;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CreatorSuggestionResponse {

    private String username;
    private String image;
    /** USER, ARTIST, or ADMIN — search is not limited to artists. */
    private String role;

    public CreatorSuggestionResponse(User u) {
        this.username = u.getUsername();
        this.image = u.getImage();
        this.role = u.getAccount() != null && u.getAccount().getRole() != null
                ? u.getAccount().getRole().name()
                : null;
    }
}
