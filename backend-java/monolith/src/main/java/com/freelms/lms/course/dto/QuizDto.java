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
public class QuizDto {
    private Long id;
    private Long lessonId;
    private String title;
    private String description;
    private Integer passingScore;
    private Integer timeLimitMinutes;
    private Integer maxAttempts;
    private boolean shuffleQuestions;
    private boolean shuffleAnswers;
    private boolean showCorrectAnswers;
    private Integer questionCount;
    private Integer totalPoints;
    private List<QuizQuestionDto> questions;
}
