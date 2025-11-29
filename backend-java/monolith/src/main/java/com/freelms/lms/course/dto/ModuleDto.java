package com.freelms.lms.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleDto {
    private Long id;
    private Long courseId;
    private String title;
    private String description;
    private Integer sortOrder;
    private boolean published;
    private Integer durationMinutes;
    private Integer lessonCount;
    private List<LessonDto> lessons;
}
