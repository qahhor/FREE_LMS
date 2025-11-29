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
public class CategoryDto {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String iconUrl;
    private String color;
    private Long parentId;
    private String parentName;
    private Integer sortOrder;
    private boolean active;
    private Integer courseCount;
    private List<CategoryDto> children;
}
