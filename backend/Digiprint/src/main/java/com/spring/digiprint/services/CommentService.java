package com.spring.digiprint.services;

import com.spring.digiprint.dtos.requests.CommentRequest;
import com.spring.digiprint.dtos.responses.CommentResponse;

import java.util.List;

public interface CommentService {

    List<CommentResponse> getCommentsByWork(Integer workId);

    CommentResponse addComment(CommentRequest request);

    CommentResponse updateComment(Integer commentId, CommentRequest request);

    void deleteComment(Integer commentId);
}

