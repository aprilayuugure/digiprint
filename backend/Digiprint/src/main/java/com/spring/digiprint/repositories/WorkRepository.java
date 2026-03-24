package com.spring.digiprint.repositories;

import com.spring.digiprint.dtos.responses.WorkPreviewResponse;
import com.spring.digiprint.entities.*;
import com.spring.digiprint.enums.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface WorkRepository extends JpaRepository<Work, Integer> {

    long countByUser_UserId(Integer userId);

    long countByUser_UserIdAndGenre(Integer userId, Genre genre);

    /**
     * Đếm số work upload theo tháng (SQL Server) — dùng cho dashboard.
     */
    @Query(
            value = """
                    SELECT YEAR(w.work_upload_date), MONTH(w.work_upload_date), COUNT(*)
                    FROM works w
                    WHERE w.user_id = :userId
                      AND w.work_upload_date >= :from
                    GROUP BY YEAR(w.work_upload_date), MONTH(w.work_upload_date)
                    """,
            nativeQuery = true
    )
    List<Object[]> countWorksUploadedByMonth(@Param("userId") Integer userId, @Param("from") LocalDateTime from);

    /**
     * Một query: user + account + tags (tránh N+1 khi build {@link com.spring.digiprint.dtos.responses.WorkResponse}).
     */
    @EntityGraph(attributePaths = {
            "user",
            "user.account",
            "workTags",
            "workTags.tag"
    })
    @Query("SELECT w FROM Work w WHERE w.workId = :id")
    Optional<Work> findByIdWithUserAndAccount(@Param("id") Integer id);

    @Query("""
        SELECT new com.spring.digiprint.dtos.responses.WorkPreviewResponse(
            w.workId,
            COALESCE(w.likeCount, 0),
            w.thumbnail,
            u.image,
            u.username
        )
        FROM Work w
        JOIN w.user u
        WHERE w.genre = :genre
          AND (:artistName IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :artistName, '%')))
          AND (:startDate IS NULL OR w.workUploadDate >= :startDate)
          AND (:endDate IS NULL OR w.workUploadDate <= :endDate)
          AND (:ratings IS NULL OR w.rating IN :ratings)
          AND (
              :tags IS NULL OR
              (SELECT COUNT(DISTINCT t2.tagName)
               FROM WorkTag wt2
               JOIN wt2.tag t2
               WHERE wt2.work = w AND t2.tagName IN :tags) = :tagCount
          )
    """)
    Page<WorkPreviewResponse> filterWorksByConditionsAndTags(
            Genre genre,
            String artistName,
            LocalDateTime startDate,
            LocalDateTime endDate,
            List<Rating> ratings,
            List<String> tags,
            Integer tagCount,
            Pageable pageable
    );

    @Modifying
    @Query("""
        UPDATE Work w
        SET w.likeCount = COALESCE(w.likeCount, 0) + 1
        WHERE w.workId = :workId
    """)
    void incrementLikeCount(Integer workId);

    @Modifying
    @Query("""
        UPDATE Work w
        SET w.likeCount = CASE
            WHEN COALESCE(w.likeCount, 0) > 0 THEN COALESCE(w.likeCount, 0) - 1
            ELSE 0
        END
        WHERE w.workId = :workId
    """)
    void decrementLikeCount(Integer workId);

    @Query("""
        SELECT new com.spring.digiprint.dtos.responses.WorkPreviewResponse(
            w.workId,
            COALESCE(w.likeCount, 0),
            w.thumbnail,
            u.image,
            u.username
        )
        FROM Work w
        JOIN w.user u
        JOIN w.workTags wt
        JOIN wt.tag t
        WHERE t.tagName = :tagName
    """)
    Page<WorkPreviewResponse> findWorksByTagName(
            @Param("tagName") String tagName,
            Pageable pageable
    );
}
