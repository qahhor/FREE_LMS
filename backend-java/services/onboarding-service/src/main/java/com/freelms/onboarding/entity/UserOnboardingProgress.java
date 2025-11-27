package com.freelms.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.*;

/**
 * Smartup LMS - User Onboarding Progress Entity
 *
 * Tracks individual user's progress through onboarding flows.
 */
@Entity
@Table(name = "user_onboarding_progress",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "flow_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserOnboardingProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "organization_id")
    private Long organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flow_id", nullable = false)
    private OnboardingFlow flow;

    // Progress tracking
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProgressStatus status = ProgressStatus.NOT_STARTED;

    @Column(name = "current_step_index")
    private Integer currentStepIndex = 0;

    @Column(name = "current_step_id")
    private Long currentStepId;

    @Column(name = "completed_steps")
    private Integer completedSteps = 0;

    @Column(name = "skipped_steps")
    private Integer skippedSteps = 0;

    @Column(name = "total_steps")
    private Integer totalSteps;

    @Column(name = "progress_percent")
    private Double progressPercent = 0.0;

    // Step completion details
    @ElementCollection
    @CollectionTable(name = "user_step_completions", joinColumns = @JoinColumn(name = "progress_id"))
    @MapKeyColumn(name = "step_id")
    @Column(name = "completed_at")
    private Map<Long, Instant> stepCompletions = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "user_step_skips", joinColumns = @JoinColumn(name = "progress_id"))
    @Column(name = "step_id")
    private Set<Long> skippedStepIds = new HashSet<>();

    // Time tracking
    @Column(name = "total_time_spent_seconds")
    private Long totalTimeSpentSeconds = 0L;

    @ElementCollection
    @CollectionTable(name = "user_step_time", joinColumns = @JoinColumn(name = "progress_id"))
    @MapKeyColumn(name = "step_id")
    @Column(name = "time_spent_seconds")
    private Map<Long, Long> stepTimeSpent = new HashMap<>();

    // Gamification
    @Column(name = "points_earned")
    private Integer pointsEarned = 0;

    @Column(name = "badge_earned")
    private boolean badgeEarned = false;

    // Session info
    @Column(name = "session_count")
    private Integer sessionCount = 0;

    @Column(name = "last_session_start")
    private Instant lastSessionStart;

    // Completion
    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "completion_feedback")
    private String completionFeedback;

    @Column(name = "completion_rating")
    private Integer completionRating; // 1-5

    // Dismissal
    @Column(name = "dismissed")
    private boolean dismissed = false;

    @Column(name = "dismissed_at")
    private Instant dismissedAt;

    @Column(name = "dismiss_reason")
    private String dismissReason;

    // Reminders
    @Column(name = "reminder_sent")
    private boolean reminderSent = false;

    @Column(name = "reminder_sent_at")
    private Instant reminderSentAt;

    // Device info
    @Column(name = "device_type")
    private String deviceType;

    @Column(name = "browser")
    private String browser;

    // Timestamps
    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private Instant startedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum ProgressStatus {
        NOT_STARTED,       // Haven't begun
        IN_PROGRESS,       // Currently doing
        PAUSED,            // Paused by user
        COMPLETED,         // Successfully completed
        SKIPPED,           // Skipped entirely
        DISMISSED,         // Dismissed/closed
        EXPIRED            // Session expired
    }

    // Helper methods
    public boolean isCompleted() {
        return status == ProgressStatus.COMPLETED;
    }

    public boolean canContinue() {
        return status == ProgressStatus.IN_PROGRESS || status == ProgressStatus.PAUSED;
    }

    public void completeStep(Long stepId, long timeSpentSeconds, int points) {
        stepCompletions.put(stepId, Instant.now());
        stepTimeSpent.put(stepId, timeSpentSeconds);
        completedSteps++;
        totalTimeSpentSeconds += timeSpentSeconds;
        pointsEarned += points;
        updateProgress();
    }

    public void skipStep(Long stepId) {
        skippedStepIds.add(stepId);
        skippedSteps++;
        updateProgress();
    }

    public void updateProgress() {
        if (totalSteps != null && totalSteps > 0) {
            progressPercent = ((completedSteps + skippedSteps) * 100.0) / totalSteps;
        }
        if (completedSteps + skippedSteps >= totalSteps) {
            status = ProgressStatus.COMPLETED;
            completedAt = Instant.now();
        }
    }

    public void startSession() {
        sessionCount++;
        lastSessionStart = Instant.now();
        if (status == ProgressStatus.NOT_STARTED) {
            status = ProgressStatus.IN_PROGRESS;
        }
    }

    public void pauseSession() {
        if (status == ProgressStatus.IN_PROGRESS) {
            status = ProgressStatus.PAUSED;
        }
    }

    public void dismiss(String reason) {
        dismissed = true;
        dismissedAt = Instant.now();
        dismissReason = reason;
        status = ProgressStatus.DISMISSED;
    }
}
