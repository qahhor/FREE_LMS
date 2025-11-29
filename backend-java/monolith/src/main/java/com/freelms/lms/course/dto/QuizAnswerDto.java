package com.freelms.lms.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswerDto {
    private Long id;
    private String answerText;
    private boolean correct;
    private Integer sortOrder;
    private String feedback;
}
