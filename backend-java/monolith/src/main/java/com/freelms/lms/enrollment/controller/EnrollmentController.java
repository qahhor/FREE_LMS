package com.freelms.lms.enrollment.controller;

import com.freelms.lms.common.dto.ApiResponse;
import com.freelms.lms.common.dto.PagedResponse;
import com.freelms.lms.common.security.CurrentUser;
import com.freelms.lms.common.security.UserPrincipal;
import com.freelms.lms.enrollment.dto.EnrollRequest;
import com.freelms.lms.enrollment.dto.EnrollmentDto;
import com.freelms.lms.enrollment.dto.UpdateProgressRequest;
import com.freelms.lms.enrollment.service.EnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
@Tag(name = "Enrollments", description = "Course enrollment endpoints")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    @Operation(summary = "Enroll in a course")
    public ResponseEntity<ApiResponse<EnrollmentDto>> enroll(
            @CurrentUser UserPrincipal userPrincipal,
            @Valid @RequestBody EnrollRequest request) {
        EnrollmentDto enrollment = enrollmentService.enroll(userPrincipal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(enrollment, "Enrolled successfully"));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my enrollments")
    public ResponseEntity<ApiResponse<PagedResponse<EnrollmentDto>>> getMyEnrollments(
            @CurrentUser UserPrincipal userPrincipal,
            @PageableDefault(size = 20, sort = "enrolledAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<EnrollmentDto> enrollments = enrollmentService.getUserEnrollments(
                userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(enrollments));
    }

    @GetMapping("/my/active")
    @Operation(summary = "Get my active enrollments")
    public ResponseEntity<ApiResponse<PagedResponse<EnrollmentDto>>> getMyActiveEnrollments(
            @CurrentUser UserPrincipal userPrincipal,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<EnrollmentDto> enrollments = enrollmentService.getUserActiveEnrollments(
                userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(enrollments));
    }

    @GetMapping("/my/completed")
    @Operation(summary = "Get my completed enrollments")
    public ResponseEntity<ApiResponse<PagedResponse<EnrollmentDto>>> getMyCompletedEnrollments(
            @CurrentUser UserPrincipal userPrincipal,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<EnrollmentDto> enrollments = enrollmentService.getUserCompletedEnrollments(
                userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(enrollments));
    }

    @GetMapping("/my/recent")
    @Operation(summary = "Get my recent enrollments")
    public ResponseEntity<ApiResponse<PagedResponse<EnrollmentDto>>> getMyRecentEnrollments(
            @CurrentUser UserPrincipal userPrincipal,
            @PageableDefault(size = 5) Pageable pageable) {
        PagedResponse<EnrollmentDto> enrollments = enrollmentService.getRecentEnrollments(
                userPrincipal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(enrollments));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get enrollment by ID")
    public ResponseEntity<ApiResponse<EnrollmentDto>> getEnrollmentById(@PathVariable Long id) {
        EnrollmentDto enrollment = enrollmentService.getEnrollmentById(id);
        return ResponseEntity.ok(ApiResponse.success(enrollment));
    }

    @GetMapping("/course/{courseId}")
    @Operation(summary = "Get my enrollment for a specific course")
    public ResponseEntity<ApiResponse<EnrollmentDto>> getEnrollmentByCourse(
            @CurrentUser UserPrincipal userPrincipal,
            @PathVariable Long courseId) {
        EnrollmentDto enrollment = enrollmentService.getEnrollment(userPrincipal.getId(), courseId);
        return ResponseEntity.ok(ApiResponse.success(enrollment));
    }

    @GetMapping("/check/{courseId}")
    @Operation(summary = "Check if enrolled in a course")
    public ResponseEntity<ApiResponse<Boolean>> checkEnrollment(
            @CurrentUser UserPrincipal userPrincipal,
            @PathVariable Long courseId) {
        boolean enrolled = enrollmentService.isEnrolled(userPrincipal.getId(), courseId);
        return ResponseEntity.ok(ApiResponse.success(enrolled));
    }

    @PutMapping("/{id}/progress")
    @Operation(summary = "Update enrollment progress")
    public ResponseEntity<ApiResponse<EnrollmentDto>> updateProgress(
            @CurrentUser UserPrincipal userPrincipal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateProgressRequest request) {
        EnrollmentDto enrollment = enrollmentService.updateProgress(userPrincipal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(enrollment, "Progress updated successfully"));
    }

    @PostMapping("/{id}/drop")
    @Operation(summary = "Drop enrollment")
    public ResponseEntity<ApiResponse<Void>> dropEnrollment(
            @CurrentUser UserPrincipal userPrincipal,
            @PathVariable Long id) {
        enrollmentService.dropEnrollment(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Enrollment dropped successfully"));
    }
}
