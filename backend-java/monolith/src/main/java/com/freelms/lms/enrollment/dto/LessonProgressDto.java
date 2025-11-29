package com.freelms.lms.enrollment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonProgressDto {
    private Long id;
    private Long enrollmentId;
    private Long lessonId;
    private String lessonTitle;
    private boolean completed;
    private LocalDateTime completedAt;
    private Integer timeSpentSeconds;
    private Integer videoPositionSeconds;
    private LocalDateTime lastAccessedAt;
}
