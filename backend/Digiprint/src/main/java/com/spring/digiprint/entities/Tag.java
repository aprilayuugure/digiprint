package com.spring.digiprint.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.spring.digiprint.enums.Genre;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "tags")
public class Tag implements Serializable{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tag_id")
    private Integer tagId;

    @Column(name = "tag_name", unique = true)
    private String tagName;

    @Column(name = "tag_description")
    private String tagDescription;

    @Column(name = "tag_work_count")
    private int tagWorkCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "tag_genre")
    private Genre tagGenre;

    @OneToMany(mappedBy = "tag", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<WorkTag> workTags;
}
