package com.spring.digiprint.services.impl;

import com.spring.digiprint.dtos.requests.CommentRequest;
import com.spring.digiprint.dtos.responses.CommentResponse;
import com.spring.digiprint.enums.Role;
import com.spring.digiprint.entities.Comment;
import com.spring.digiprint.entities.User;
import com.spring.digiprint.entities.Work;
import com.spring.digiprint.repositories.CommentRepository;
import com.spring.digiprint.repositories.UserRepository;
import com.spring.digiprint.repositories.WorkRepository;
import com.spring.digiprint.services.CommentService;
import com.spring.digiprint.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepo;
    private final WorkRepository workRepo;
    private final UserRepository userRepo;

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByWork(Integer workId) {
        Work work = workRepo.findById(workId)
                .orElseThrow(() -> new RuntimeException("Work not found"));

        return commentRepo.findByWorkOrderByCommentDateAsc(work)
                .stream()
                .map(CommentResponse::new)
                .toList();
    }

    @Override
    public CommentResponse addComment(CommentRequest request) {
        Integer accountId = SecurityUtil.getCurrentUserId();
        User user = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Work work = workRepo.findById(request.getWorkId())
                .orElseThrow(() -> new RuntimeException("Work not found"));

        Comment comment = new Comment();
        comment.setWork(work);
        comment.setUser(user);
        comment.setCommentContent(request.getCommentContent());

        if (request.getReplyToId() != null) {
            Comment parent = commentRepo.findById(request.getReplyToId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            comment.setReplyTo(parent);
        }

        Comment saved = commentRepo.save(comment);
        return new CommentResponse(saved);
    }

    @Override
    public CommentResponse updateComment(Integer commentId, CommentRequest request) {
        Integer accountId = SecurityUtil.getCurrentUserId();
        User currentUser = userRepo.findByAccount_AccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        boolean isOwner = comment.getUser() != null
                && comment.getUser().getUserId() != null
                && currentUser.getUserId() != null
                && comment.getUser().getUserId().equals(currentUser.getUserId());
        boolean isAdmin = currentUser.getAccount() != null
                && currentUser.getAccount().getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("You cannot edit this comment");
        }

        comment.setCommentContent(request.getCommentContent());
        Comment saved = commentRepo.save(comment);
        return new CommentResponse(saved);
    }

    @Override
    public void deleteComment(Integer commentId) {
        Comment c = commentRepo.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        deleteCommentTree(c.getCommentId());
    }

    private void deleteCommentTree(Integer commentId) {
        List<Comment> replies = commentRepo.findByReplyTo_CommentId(commentId);
        for (Comment reply : replies) {
            deleteCommentTree(reply.getCommentId());
        }
        commentRepo.deleteById(commentId);
    }
}

