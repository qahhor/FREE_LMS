package com.freelms.lms.course.dto;

import com.freelms.lms.common.enums.CourseLevel;
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
public class UpdateCourseRequest {

    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 10000, message = "Description must not exceed 10000 characters")
    private String description;

    @Size(max = 500, message = "Short description must not exceed 500 characters")
    private String shortDescription;

    private String thumbnailUrl;
    private String previewVideoUrl;
    private CourseLevel level;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Boolean isFree;
    private Long categoryId;
    private String language;
    private String whatYouWillLearn;
    private String requirements;
    private String targetAudience;
    private Boolean completionCertificate;
    private Boolean isFeatured;
    private Set<String> tags;
}
