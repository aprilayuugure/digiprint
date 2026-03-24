package com.spring.digiprint.entities;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "work_tags")
public class WorkTag implements Serializable {
    @EmbeddedId
    private WorkTagId id = new WorkTagId();

    @ManyToOne
    @MapsId("workId")
    @JoinColumn(name = "work_id")
    private Work work;

    @ManyToOne
    @MapsId("tagId")
    @JoinColumn(name = "tag_id")
    private Tag tag;
}
