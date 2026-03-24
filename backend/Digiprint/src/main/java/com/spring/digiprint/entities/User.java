package com.spring.digiprint.entities;

import com.spring.digiprint.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.*;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "users")
public class User implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "background_image_url")
    private String backgroundImage;

    @Column(name = "image_url")
    private String image;

    @Column(name =  "username", unique = true)
    private String username;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "location")
    private String location;

    @Column(name = "biography")
    private String biography;

    @OneToOne
    @JoinColumn(name = "account_id")
    private Account account;
}
