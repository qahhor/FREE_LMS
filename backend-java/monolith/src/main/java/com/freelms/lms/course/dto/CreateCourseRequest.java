package com.freelms.lms.course.dto;

import com.freelms.lms.common.enums.CourseLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCourseRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 10000, message = "Description must not exceed 10000 characters")
    private String description;

    @Size(max = 500, message = "Short description must not exceed 500 characters")
    private String shortDescription;

    private String thumbnailUrl;
    private String previewVideoUrl;

    @Builder.Default
    private CourseLevel level = CourseLevel.BEGINNER;

    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    private BigDecimal originalPrice;

    @Builder.Default
    private boolean isFree = true;

    private Long categoryId;
    private Long organizationId;

    @Builder.Default
    private String language = "en";

    private String whatYouWillLearn;
    private String requirements;
    private String targetAudience;

    @Builder.Default
    private boolean completionCertificate = true;

    private Set<String> tags;
}
