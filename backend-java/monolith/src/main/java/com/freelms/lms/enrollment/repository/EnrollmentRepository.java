package com.freelms.lms.enrollment.repository;

import com.freelms.lms.common.enums.EnrollmentStatus;
import com.freelms.lms.enrollment.entity.Enrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    Optional<Enrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    Page<Enrollment> findByUserId(Long userId, Pageable pageable);

    Page<Enrollment> findByUserIdAndStatus(Long userId, EnrollmentStatus status, Pageable pageable);

    Page<Enrollment> findByCourseId(Long courseId, Pageable pageable);

    @Query("SELECT e FROM Enrollment e WHERE e.userId = :userId AND e.status IN :statuses ORDER BY e.lastAccessedAt DESC")
    Page<Enrollment> findByUserIdAndStatusIn(@Param("userId") Long userId,
                                              @Param("statuses") List<EnrollmentStatus> statuses,
                                              Pageable pageable);

    @Query("SELECT e FROM Enrollment e WHERE e.userId = :userId ORDER BY e.lastAccessedAt DESC NULLS LAST")
    Page<Enrollment> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.courseId = :courseId AND e.status = :status")
    long countByCourseIdAndStatus(@Param("courseId") Long courseId, @Param("status") EnrollmentStatus status);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.userId = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.userId = :userId AND e.status = 'COMPLETED'")
    long countCompletedByUserId(@Param("userId") Long userId);

    @Query("SELECT e.courseId FROM Enrollment e WHERE e.userId = :userId")
    List<Long> findCourseIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT AVG(e.progress) FROM Enrollment e WHERE e.courseId = :courseId")
    Double getAverageProgressByCourseId(@Param("courseId") Long courseId);
}
