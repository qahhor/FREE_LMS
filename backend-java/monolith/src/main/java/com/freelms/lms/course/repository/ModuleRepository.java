package com.freelms.lms.course.repository;

import com.freelms.lms.course.entity.CourseModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleRepository extends JpaRepository<CourseModule, Long> {

    List<CourseModule> findByCourseIdOrderBySortOrderAsc(Long courseId);

    @Query("SELECT m FROM CourseModule m WHERE m.course.id = :courseId AND m.isPublished = true ORDER BY m.sortOrder ASC")
    List<CourseModule> findPublishedModulesByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT MAX(m.sortOrder) FROM CourseModule m WHERE m.course.id = :courseId")
    Optional<Integer> findMaxSortOrderByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT COUNT(m) FROM CourseModule m WHERE m.course.id = :courseId")
    long countByCourseId(@Param("courseId") Long courseId);
}
