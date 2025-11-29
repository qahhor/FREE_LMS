package com.freelms.lms.course.repository;

import com.freelms.lms.course.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Category> findByParentIsNullAndIsActiveTrueOrderBySortOrderAsc();

    List<Category> findByParentIdAndIsActiveTrueOrderBySortOrderAsc(Long parentId);

    List<Category> findByIsActiveTrueOrderBySortOrderAsc();

    @Query("SELECT c FROM Category c WHERE c.parent IS NULL ORDER BY c.courseCount DESC")
    List<Category> findTopCategories();

    @Query("SELECT c FROM Category c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Category> searchCategories(String query);

    boolean existsByName(String name);
}
