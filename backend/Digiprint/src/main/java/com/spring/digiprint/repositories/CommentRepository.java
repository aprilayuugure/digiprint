package com.spring.digiprint.repositories;

import com.spring.digiprint.entities.Comment;
import com.spring.digiprint.entities.Work;
import com.spring.digiprint.entities.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Integer> {

    @EntityGraph(attributePaths = {"user", "work", "replyTo"})
    List<Comment> findByWorkOrderByCommentDateAsc(Work work);

    List<Comment> findByUserOrderByCommentDateDesc(User user);

    List<Comment> findByReplyTo_CommentId(Integer replyToId);
}

