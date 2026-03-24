package com.spring.digiprint.entities;

import com.spring.digiprint.enums.*;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.*;
import java.util.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "works")
public class Work implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "work_id")
    private Integer workId;

    @Enumerated(EnumType.STRING)
    @Column(name = "genre")
    private Genre genre;

    @Column(name = "work_source")
    private String workSource;

    @Column(name = "thumbnail")
    private String thumbnail;

    @Column(name = "work_title")
    private String workTitle;

    @Column(name = "work_description")
    private String workDescription;

    @Column(name = "work_upload_date")
    private LocalDateTime workUploadDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "rating")
    private Rating rating;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "work", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkTag> workTags;

    @Column(name = "like_count")
    private Integer likeCount = 0;

    @PrePersist
    protected void onCreate() {
        if (workUploadDate == null) {
            workUploadDate = LocalDateTime.now();
        }
        if (likeCount == null) {
            likeCount = 0;
        }
    }
}
