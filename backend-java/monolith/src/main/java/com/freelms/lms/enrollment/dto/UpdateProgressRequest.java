package com.freelms.lms.enrollment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProgressRequest {

    @NotNull(message = "Lesson ID is required")
    private Long lessonId;

    private boolean completed;
    private Integer timeSpentSeconds;
    private Integer videoPositionSeconds;
}
