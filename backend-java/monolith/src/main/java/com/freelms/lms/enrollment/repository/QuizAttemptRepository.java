package com.freelms.lms.enrollment.repository;

import com.freelms.lms.enrollment.entity.QuizAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByEnrollmentIdAndQuizIdOrderByAttemptNumberDesc(Long enrollmentId, Long quizId);

    Page<QuizAttempt> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT MAX(qa.attemptNumber) FROM QuizAttempt qa WHERE qa.enrollmentId = :enrollmentId AND qa.quizId = :quizId")
    Optional<Integer> findMaxAttemptNumber(@Param("enrollmentId") Long enrollmentId, @Param("quizId") Long quizId);

    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.enrollmentId = :enrollmentId AND qa.quizId = :quizId AND qa.isPassed = true")
    Optional<QuizAttempt> findPassedAttempt(@Param("enrollmentId") Long enrollmentId, @Param("quizId") Long quizId);

    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.enrollmentId = :enrollmentId AND qa.quizId = :quizId")
    long countAttempts(@Param("enrollmentId") Long enrollmentId, @Param("quizId") Long quizId);

    @Query("SELECT AVG(qa.percentage) FROM QuizAttempt qa WHERE qa.quizId = :quizId AND qa.completedAt IS NOT NULL")
    Double getAverageScoreByQuizId(@Param("quizId") Long quizId);
}
