package com.freelms.lms.course.dto;

import com.freelms.lms.common.enums.LessonType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonDto {
    private Long id;
    private Long moduleId;
    private String title;
    private String content;
    private LessonType type;
    private String videoUrl;
    private String documentUrl;
    private Integer durationMinutes;
    private Integer sortOrder;
    private boolean published;
    private boolean preview;
    private boolean mandatory;
    private QuizDto quiz;
}
