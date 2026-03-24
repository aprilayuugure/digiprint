package com.spring.digiprint.repositories;

import com.spring.digiprint.dtos.responses.WorkPreviewResponse;
import com.spring.digiprint.entities.Favorite;
import com.spring.digiprint.entities.FavoriteId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FavoriteRepository extends JpaRepository<Favorite, FavoriteId> {

    void deleteByUser_UserIdAndWork_WorkId(Integer userId, Integer workId);

    boolean existsByUser_UserIdAndWork_WorkId(Integer userId, Integer workId);

    @Query("""
        SELECT new com.spring.digiprint.dtos.responses.WorkPreviewResponse(
            w.workId,
            COALESCE(w.likeCount, 0),
            w.thumbnail,
            u.image,
            u.username
        )
        FROM Favorite f
        JOIN f.work w
        JOIN w.user u
        WHERE f.user.userId = :userId
        ORDER BY w.workUploadDate DESC
        """)
    Page<WorkPreviewResponse> findFavoriteWorkPreviewsByUserId(
            @Param("userId") Integer userId,
            Pageable pageable
    );
}
