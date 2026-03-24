package com.spring.digiprint.repositories;

import com.spring.digiprint.entities.*;
import com.spring.digiprint.enums.Genre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface TagRepository extends JpaRepository<Tag, Integer> {
    public List<Tag> getTagByTagGenre(Genre g);

    public Optional<Tag> findByTagName(String name);
}
