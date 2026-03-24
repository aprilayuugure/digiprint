package com.spring.digiprint.controllers;

import com.spring.digiprint.dtos.requests.CommentRequest;
import com.spring.digiprint.dtos.responses.CommentResponse;
import com.spring.digiprint.services.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RequiredArgsConstructor
@RequestMapping("/comments")
@RestController
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/work/{workId}")
    public ResponseEntity<List<CommentResponse>> getByWork(@PathVariable Integer workId) {
        return ResponseEntity.ok(commentService.getCommentsByWork(workId));
    }

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(@Valid @RequestBody CommentRequest request) {
        return ResponseEntity.ok(commentService.addComment(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Integer id,
            @Valid @RequestBody CommentRequest request
    ) {
        return ResponseEntity.ok(commentService.updateComment(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Integer id) {
        commentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }
}

