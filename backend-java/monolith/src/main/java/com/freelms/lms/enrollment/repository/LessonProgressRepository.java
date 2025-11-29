package com.freelms.lms.enrollment.repository;

import com.freelms.lms.enrollment.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByEnrollmentIdAndLessonId(Long enrollmentId, Long lessonId);

    List<LessonProgress> findByEnrollmentId(Long enrollmentId);

    @Query("SELECT COUNT(lp) FROM LessonProgress lp WHERE lp.enrollment.id = :enrollmentId AND lp.isCompleted = true")
    long countCompletedByEnrollmentId(@Param("enrollmentId") Long enrollmentId);

    @Query("SELECT SUM(lp.timeSpentSeconds) FROM LessonProgress lp WHERE lp.enrollment.id = :enrollmentId")
    Long sumTimeSpentByEnrollmentId(@Param("enrollmentId") Long enrollmentId);

    @Query("SELECT lp FROM LessonProgress lp WHERE lp.enrollment.id = :enrollmentId AND lp.isCompleted = true")
    List<LessonProgress> findCompletedByEnrollmentId(@Param("enrollmentId") Long enrollmentId);

    void deleteByEnrollmentId(Long enrollmentId);
}
