package com.spring.digiprint.repositories;

import com.spring.digiprint.entities.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LikeRepository extends JpaRepository<Like, LikeId> {
    List<Like> findByWork_WorkId(Integer id);

    void deleteByUser_UserIdAndWork_WorkId(Integer userId, Integer workId);

    boolean existsByUser_UserIdAndWork_WorkId(Integer userId, Integer workId);

    @Query("""
        SELECT l.user
        FROM Like l
        WHERE l.work.workId = :workId
    """)
    List<User> findUsersByWorkId(Integer workId);
}
