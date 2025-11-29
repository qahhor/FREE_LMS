package com.freelms.lms.course.dto;

import com.freelms.lms.common.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestionDto {
    private Long id;
    private String questionText;
    private QuestionType type;
    private Integer sortOrder;
    private Integer points;
    private String explanation;
    private String imageUrl;
    private List<QuizAnswerDto> answers;
}
