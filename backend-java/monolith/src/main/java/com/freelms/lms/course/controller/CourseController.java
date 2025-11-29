package com.freelms.lms.course.controller;

import com.freelms.lms.common.dto.ApiResponse;
import com.freelms.lms.common.dto.PagedResponse;
import com.freelms.lms.common.enums.CourseLevel;
import com.freelms.lms.common.security.CurrentUser;
import com.freelms.lms.common.security.UserPrincipal;
import com.freelms.lms.course.dto.CourseDto;
import com.freelms.lms.course.dto.CreateCourseRequest;
import com.freelms.lms.course.dto.UpdateCourseRequest;
import com.freelms.lms.course.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
@Tag(name = "Courses", description = "Course management endpoints")
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    @Operation(summary = "Get all published courses")
    public ResponseEntity<ApiResponse<PagedResponse<CourseDto>>> getAllCourses(
            @PageableDefault(size = 20, sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<CourseDto> courses = courseService.getAllPublishedCourses(pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get course by ID")
    public ResponseEntity<ApiResponse<CourseDto>> getCourseById(@PathVariable Long id) {
        CourseDto course = courseService.getCourseById(id);
        return ResponseEntity.ok(ApiResponse.success(course));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get course by slug")
    public ResponseEntity<ApiResponse<CourseDto>> getCourseBySlug(@PathVariable String slug) {
        CourseDto course = courseService.getCourseBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(course));
    }

    @GetMapping("/popular")
    @Operation(summary = "Get popular courses")
    public ResponseEntity<ApiResponse<PagedResponse<CourseDto>>> getPopularCourses(
            @PageableDefault(size = 10) Pageable pageable) {
        PagedResponse<CourseDto> courses = courseService.getPopularCourses(pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent courses")
    public ResponseEntity<ApiResponse<PagedResponse<CourseDto>>> getRecentCourses(
            @PageableDefault(size = 10) Pageable pageable) {
        PagedResponse<CourseDto> courses = courseService.getRecentCourses(pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured courses")
    public ResponseEntity<ApiResponse<PagedResponse<CourseDto>>> getFeaturedCourses(
            @PageableDefault(size = 10) Pageable pageable) {
        PagedResponse<CourseDto> courses = courseService.getFeaturedCourses(pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @GetMapping("/search")
    @Operation(summary = "Search courses")
    public ResponseEntity<ApiResponse<PagedResponse<CourseDto>>> searchCourses(
            @RequestParam String q,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<CourseDto> courses = courseService.searchCourses(q, pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @GetMapping("/filter")
    @Operation(summary = "Filter courses")
    public ResponseEntity<ApiResponse<PagedResponse<CourseDto>>> filterCourses(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) CourseLevel level,
            @RequestParam(required = false) Boolean isFree,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<CourseDto> courses = courseService.filterCourses(categoryId, level, isFree, pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @GetMapping("/instructor/{instructorId}")
    @Operation(summary = "Get courses by instructor")
    public ResponseEntity<ApiResponse<PagedResponse<CourseDto>>> getCoursesByInstructor(
            @PathVariable Long instructorId,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<CourseDto> courses = courseService.getCoursesByInstructor(instructorId, pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get courses by category")
    public ResponseEntity<ApiResponse<PagedResponse<CourseDto>>> getCoursesByCategory(
            @PathVariable Long categoryId,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<CourseDto> courses = courseService.getCoursesByCategory(categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.success(courses));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @Operation(summary = "Create a new course")
    public ResponseEntity<ApiResponse<CourseDto>> createCourse(
            @CurrentUser UserPrincipal userPrincipal,
            @Valid @RequestBody CreateCourseRequest request) {
        CourseDto course = courseService.createCourse(userPrincipal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(course, "Course created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @Operation(summary = "Update a course")
    public ResponseEntity<ApiResponse<CourseDto>> updateCourse(
            @PathVariable Long id,
            @CurrentUser UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateCourseRequest request) {
        CourseDto course = courseService.updateCourse(id, userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(course, "Course updated successfully"));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @Operation(summary = "Publish a course")
    public ResponseEntity<ApiResponse<CourseDto>> publishCourse(
            @PathVariable Long id,
            @CurrentUser UserPrincipal userPrincipal) {
        CourseDto course = courseService.publishCourse(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(course, "Course published successfully"));
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @Operation(summary = "Archive a course")
    public ResponseEntity<ApiResponse<Void>> archiveCourse(
            @PathVariable Long id,
            @CurrentUser UserPrincipal userPrincipal) {
        courseService.archiveCourse(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Course archived successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @Operation(summary = "Delete a course")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(
            @PathVariable Long id,
            @CurrentUser UserPrincipal userPrincipal) {
        courseService.deleteCourse(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Course deleted successfully"));
    }
}
