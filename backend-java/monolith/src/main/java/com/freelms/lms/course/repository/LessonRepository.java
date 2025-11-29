package com.freelms.lms.course.repository;

import com.freelms.lms.course.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findByModuleIdOrderBySortOrderAsc(Long moduleId);

    @Query("SELECT l FROM Lesson l WHERE l.module.id = :moduleId AND l.isPublished = true ORDER BY l.sortOrder ASC")
    List<Lesson> findPublishedLessonsByModuleId(@Param("moduleId") Long moduleId);

    @Query("SELECT l FROM Lesson l WHERE l.module.course.id = :courseId ORDER BY l.module.sortOrder, l.sortOrder")
    List<Lesson> findAllByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT MAX(l.sortOrder) FROM Lesson l WHERE l.module.id = :moduleId")
    Optional<Integer> findMaxSortOrderByModuleId(@Param("moduleId") Long moduleId);

    @Query("SELECT COUNT(l) FROM Lesson l WHERE l.module.course.id = :courseId")
    long countByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT COUNT(l) FROM Lesson l WHERE l.module.id = :moduleId")
    long countByModuleId(@Param("moduleId") Long moduleId);

    @Query("SELECT SUM(l.durationMinutes) FROM Lesson l WHERE l.module.course.id = :courseId")
    Integer sumDurationByCourseId(@Param("courseId") Long courseId);
}
