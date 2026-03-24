package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.Work;
import com.spring.digiprint.enums.Genre;
import com.spring.digiprint.enums.Rating;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class WorkResponse {
    private Integer workId;

    private Genre genre;

    private String workSource;

    private String thumbnail;

    private String workTitle;

    private String workDescription;

    private LocalDateTime workUploadDate;

    private Rating rating;

    private int likeCount;

    private List<TagResponse> workTags;

    private String avatar;

    private String creator;

    /** account_id của tác giả — dùng để xác định owner (ổn định hơn so sánh username). */
    private Integer creatorAccountId;

    /** user_id của tác giả — khớp với {@code LoginResponse.userId} trên client. */
    private Integer creatorUserId;

    private List<CommentResponse> comments;

    public WorkResponse(Work w) {
        this.workId = w.getWorkId();
        this.genre = w.getGenre();
        this.workSource = w.getWorkSource();
        this.thumbnail = w.getThumbnail();
        this.workTitle = w.getWorkTitle();
        this.workDescription = w.getWorkDescription();
        this.workUploadDate = w.getWorkUploadDate();
        this.rating = w.getRating();
        this.likeCount = w.getLikeCount() != null ? w.getLikeCount() : 0;
        this.workTags = w.getWorkTags() != null
                ? w.getWorkTags().stream().map(wt -> new TagResponse(wt.getTag())).toList()
                : List.of();
        this.avatar = w.getUser() != null ? w.getUser().getImage() : null;
        this.creator = w.getUser() != null ? w.getUser().getUsername() : null;
        this.creatorAccountId = w.getUser() != null && w.getUser().getAccount() != null
                ? w.getUser().getAccount().getAccountId()
                : null;
        this.creatorUserId = w.getUser() != null ? w.getUser().getUserId() : null;
        this.comments = List.of();
    }
}
