package com.spring.digiprint.repositories;

import com.spring.digiprint.entities.Sample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SampleRepository extends JpaRepository<Sample, Integer> {
}
