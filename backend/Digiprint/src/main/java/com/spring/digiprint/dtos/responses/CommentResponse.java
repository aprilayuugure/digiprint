package com.spring.digiprint.dtos.responses;

import com.spring.digiprint.entities.Comment;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CommentResponse {

    private Integer commentId;

    private Integer workId;

    private Integer userId;

    private String username;

    private String userAvatar;

    private Integer replyToId;

    private String commentContent;

    private LocalDateTime commentDate;

    public CommentResponse(Comment c) {
        this.commentId = c.getCommentId();
        this.workId = c.getWork() != null ? c.getWork().getWorkId() : null;
        if (c.getUser() != null) {
            this.userId = c.getUser().getUserId();
            this.username = c.getUser().getUsername();
            this.userAvatar = c.getUser().getImage();
        }
        this.replyToId = c.getReplyTo() != null ? c.getReplyTo().getCommentId() : null;
        this.commentContent = c.getCommentContent();
        this.commentDate = c.getCommentDate();
    }
}

