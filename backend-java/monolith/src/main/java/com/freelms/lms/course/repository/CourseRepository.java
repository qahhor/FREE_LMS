package com.freelms.lms.course.repository;

import com.freelms.lms.common.enums.CourseLevel;
import com.freelms.lms.common.enums.CourseStatus;
import com.freelms.lms.course.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Course> findByStatus(CourseStatus status, Pageable pageable);

    Page<Course> findByInstructorId(Long instructorId, Pageable pageable);

    Page<Course> findByCategoryId(Long categoryId, Pageable pageable);

    Page<Course> findByOrganizationId(Long organizationId, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = :status AND c.isFree = :isFree")
    Page<Course> findByStatusAndIsFree(@Param("status") CourseStatus status,
                                       @Param("isFree") boolean isFree,
                                       Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' ORDER BY c.studentCount DESC")
    Page<Course> findPopularCourses(Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' ORDER BY c.publishedAt DESC")
    Page<Course> findRecentCourses(Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND c.isFeatured = true")
    Page<Course> findFeaturedCourses(Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND " +
            "(LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Course> searchCourses(@Param("query") String query, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND " +
            "(:categoryId IS NULL OR c.category.id = :categoryId) AND " +
            "(:level IS NULL OR c.level = :level) AND " +
            "(:isFree IS NULL OR c.isFree = :isFree)")
    Page<Course> filterCourses(@Param("categoryId") Long categoryId,
                               @Param("level") CourseLevel level,
                               @Param("isFree") Boolean isFree,
                               Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = 'PUBLISHED' AND c.organizationId = :orgId AND " +
            "(LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Course> searchCoursesByOrganization(@Param("orgId") Long organizationId,
                                              @Param("query") String query,
                                              Pageable pageable);

    @Modifying
    @Query("UPDATE Course c SET c.studentCount = c.studentCount + 1 WHERE c.id = :courseId")
    void incrementStudentCount(@Param("courseId") Long courseId);

    @Query("SELECT COUNT(c) FROM Course c WHERE c.instructorId = :instructorId")
    long countByInstructorId(@Param("instructorId") Long instructorId);

    @Query("SELECT COUNT(c) FROM Course c WHERE c.status = :status")
    long countByStatus(@Param("status") CourseStatus status);

    List<Course> findByIdIn(List<Long> ids);

    @Query("SELECT c FROM Course c JOIN c.tags t WHERE t.name = :tagName AND c.status = 'PUBLISHED'")
    Page<Course> findByTagName(@Param("tagName") String tagName, Pageable pageable);
}
