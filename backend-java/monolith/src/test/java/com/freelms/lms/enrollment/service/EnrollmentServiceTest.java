package com.freelms.lms.enrollment.service;

import com.freelms.lms.common.enums.EnrollmentStatus;
import com.freelms.lms.common.exception.ConflictException;
import com.freelms.lms.common.exception.ResourceNotFoundException;
import com.freelms.lms.course.repository.CourseRepository;
import com.freelms.lms.course.repository.LessonRepository;
import com.freelms.lms.enrollment.dto.EnrollRequest;
import com.freelms.lms.enrollment.dto.EnrollmentDto;
import com.freelms.lms.enrollment.entity.Enrollment;
import com.freelms.lms.enrollment.repository.EnrollmentRepository;
import com.freelms.lms.enrollment.repository.LessonProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private LessonProgressRepository lessonProgressRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private LessonRepository lessonRepository;

    @InjectMocks
    private EnrollmentService enrollmentService;

    private Enrollment testEnrollment;
    private EnrollRequest enrollRequest;

    @BeforeEach
    void setUp() {
        testEnrollment = Enrollment.builder()
                .id(1L)
                .userId(1L)
                .courseId(1L)
                .status(EnrollmentStatus.ACTIVE)
                .progress(0)
                .enrolledAt(LocalDateTime.now())
                .build();

        enrollRequest = EnrollRequest.builder()
                .courseId(1L)
                .build();
    }

    @Test
    @DisplayName("Should enroll user successfully")
    void shouldEnrollUserSuccessfully() {
        // Given
        when(courseRepository.existsById(1L)).thenReturn(true);
        when(enrollmentRepository.existsByUserIdAndCourseId(1L, 1L)).thenReturn(false);
        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(testEnrollment);
        when(lessonProgressRepository.countCompletedByEnrollmentId(anyLong())).thenReturn(0L);
        when(lessonRepository.countByCourseId(anyLong())).thenReturn(10L);

        // When
        EnrollmentDto result = enrollmentService.enroll(1L, enrollRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getCourseId()).isEqualTo(1L);
        assertThat(result.getStatus()).isEqualTo(EnrollmentStatus.ACTIVE);
        verify(courseRepository).incrementStudentCount(1L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for non-existent course")
    void shouldThrowResourceNotFoundExceptionForNonExistentCourse() {
        // Given
        when(courseRepository.existsById(anyLong())).thenReturn(false);

        // When/Then
        assertThatThrownBy(() -> enrollmentService.enroll(1L, enrollRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Should throw ConflictException when already enrolled")
    void shouldThrowConflictExceptionWhenAlreadyEnrolled() {
        // Given
        when(courseRepository.existsById(1L)).thenReturn(true);
        when(enrollmentRepository.existsByUserIdAndCourseId(1L, 1L)).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> enrollmentService.enroll(1L, enrollRequest))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already enrolled");
    }

    @Test
    @DisplayName("Should get enrollment successfully")
    void shouldGetEnrollmentSuccessfully() {
        // Given
        when(enrollmentRepository.findByUserIdAndCourseId(1L, 1L)).thenReturn(Optional.of(testEnrollment));
        when(lessonProgressRepository.countCompletedByEnrollmentId(anyLong())).thenReturn(5L);
        when(lessonRepository.countByCourseId(anyLong())).thenReturn(10L);

        // When
        EnrollmentDto result = enrollmentService.getEnrollment(1L, 1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTotalLessons()).isEqualTo(10);
        assertThat(result.getCompletedLessons()).isEqualTo(5);
    }

    @Test
    @DisplayName("Should check enrollment status")
    void shouldCheckEnrollmentStatus() {
        // Given
        when(enrollmentRepository.existsByUserIdAndCourseId(1L, 1L)).thenReturn(true);
        when(enrollmentRepository.existsByUserIdAndCourseId(1L, 999L)).thenReturn(false);

        // When/Then
        assertThat(enrollmentService.isEnrolled(1L, 1L)).isTrue();
        assertThat(enrollmentService.isEnrolled(1L, 999L)).isFalse();
    }

    @Test
    @DisplayName("Should drop enrollment successfully")
    void shouldDropEnrollmentSuccessfully() {
        // Given
        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(testEnrollment));
        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(testEnrollment);

        // When
        enrollmentService.dropEnrollment(1L, 1L);

        // Then
        verify(enrollmentRepository).save(argThat(e -> e.getStatus() == EnrollmentStatus.DROPPED));
    }
}
