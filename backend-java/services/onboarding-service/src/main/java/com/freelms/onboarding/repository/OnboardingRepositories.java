package com.freelms.onboarding.repository;

import com.freelms.onboarding.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.*;

/**
 * Smartup LMS - Onboarding Repositories
 */

@Repository
interface OnboardingFlowRepository extends JpaRepository<OnboardingFlow, Long> {

    Optional<OnboardingFlow> findBySlug(String slug);

    Optional<OnboardingFlow> findBySlugAndActiveTrue(String slug);

    List<OnboardingFlow> findByTargetRoleAndActiveTrueAndPublishedTrue(OnboardingFlow.TargetRole role);

    List<OnboardingFlow> findByOrganizationIdAndActiveTrue(Long organizationId);

    @Query("SELECT f FROM OnboardingFlow f WHERE f.active = true AND f.published = true " +
           "AND (f.targetRole = :role OR f.targetRole = 'ALL') " +
           "AND (f.organizationId IS NULL OR f.organizationId = :orgId)")
    List<OnboardingFlow> findAvailableFlows(@Param("role") OnboardingFlow.TargetRole role,
                                            @Param("orgId") Long organizationId);

    @Query("SELECT f FROM OnboardingFlow f WHERE f.active = true AND f.published = true " +
           "AND f.autoStart = true " +
           "AND (f.targetRole = :role OR f.targetRole = 'ALL') " +
           "AND (f.organizationId IS NULL OR f.organizationId = :orgId) " +
           "AND f.id NOT IN (SELECT p.flow.id FROM UserOnboardingProgress p WHERE p.userId = :userId)")
    List<OnboardingFlow> findAutoStartFlowsForUser(@Param("userId") Long userId,
                                                    @Param("role") OnboardingFlow.TargetRole role,
                                                    @Param("orgId") Long organizationId);

    @Query("SELECT f FROM OnboardingFlow f WHERE f.active = true AND f.mandatory = true " +
           "AND (f.targetRole = :role OR f.targetRole = 'ALL') " +
           "AND (f.organizationId IS NULL OR f.organizationId = :orgId) " +
           "AND f.id NOT IN (SELECT p.flow.id FROM UserOnboardingProgress p " +
           "WHERE p.userId = :userId AND p.status = 'COMPLETED')")
    List<OnboardingFlow> findMandatoryIncompleteFlows(@Param("userId") Long userId,
                                                       @Param("role") OnboardingFlow.TargetRole role,
                                                       @Param("orgId") Long organizationId);

    Page<OnboardingFlow> findByActiveTrueOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT COUNT(f) FROM OnboardingFlow f WHERE f.organizationId = :orgId AND f.active = true")
    long countByOrganization(@Param("orgId") Long organizationId);
}

@Repository
interface OnboardingStepRepository extends JpaRepository<OnboardingStep, Long> {

    List<OnboardingStep> findByFlowIdAndActiveTrueOrderByOrderIndexAsc(Long flowId);

    Optional<OnboardingStep> findByFlowIdAndOrderIndex(Long flowId, Integer orderIndex);

    @Query("SELECT s FROM OnboardingStep s WHERE s.flow.id = :flowId AND s.active = true " +
           "AND s.orderIndex > :currentIndex ORDER BY s.orderIndex ASC")
    List<OnboardingStep> findNextSteps(@Param("flowId") Long flowId, @Param("currentIndex") Integer currentIndex);

    @Query("SELECT s FROM OnboardingStep s WHERE s.flow.id = :flowId AND s.active = true " +
           "AND s.orderIndex < :currentIndex ORDER BY s.orderIndex DESC")
    List<OnboardingStep> findPreviousSteps(@Param("flowId") Long flowId, @Param("currentIndex") Integer currentIndex);

    @Query("SELECT MAX(s.orderIndex) FROM OnboardingStep s WHERE s.flow.id = :flowId")
    Integer findMaxOrderIndex(@Param("flowId") Long flowId);

    @Query("SELECT COUNT(s) FROM OnboardingStep s WHERE s.flow.id = :flowId AND s.active = true")
    int countActiveSteps(@Param("flowId") Long flowId);

    void deleteByFlowId(Long flowId);
}

@Repository
interface UserOnboardingProgressRepository extends JpaRepository<UserOnboardingProgress, Long> {

    Optional<UserOnboardingProgress> findByUserIdAndFlowId(Long userId, Long flowId);

    List<UserOnboardingProgress> findByUserId(Long userId);

    List<UserOnboardingProgress> findByUserIdAndStatus(Long userId, UserOnboardingProgress.ProgressStatus status);

    @Query("SELECT p FROM UserOnboardingProgress p WHERE p.userId = :userId " +
           "AND p.status IN ('IN_PROGRESS', 'PAUSED') ORDER BY p.updatedAt DESC")
    List<UserOnboardingProgress> findActiveProgressForUser(@Param("userId") Long userId);

    @Query("SELECT p FROM UserOnboardingProgress p WHERE p.userId = :userId " +
           "AND p.status = 'COMPLETED' ORDER BY p.completedAt DESC")
    List<UserOnboardingProgress> findCompletedProgressForUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(p) FROM UserOnboardingProgress p WHERE p.userId = :userId AND p.status = 'COMPLETED'")
    int countCompletedByUser(@Param("userId") Long userId);

    @Query("SELECT SUM(p.pointsEarned) FROM UserOnboardingProgress p WHERE p.userId = :userId")
    Integer sumPointsByUser(@Param("userId") Long userId);

    @Query("SELECT p FROM UserOnboardingProgress p WHERE p.flow.id = :flowId")
    List<UserOnboardingProgress> findByFlowId(@Param("flowId") Long flowId);

    @Query("SELECT p FROM UserOnboardingProgress p WHERE p.organizationId = :orgId")
    List<UserOnboardingProgress> findByOrganizationId(@Param("orgId") Long organizationId);

    @Query("SELECT COUNT(DISTINCT p.userId) FROM UserOnboardingProgress p " +
           "WHERE p.flow.id = :flowId AND p.status = 'COMPLETED'")
    int countCompletedByFlow(@Param("flowId") Long flowId);

    @Query("SELECT COUNT(DISTINCT p.userId) FROM UserOnboardingProgress p WHERE p.flow.id = :flowId")
    int countStartedByFlow(@Param("flowId") Long flowId);

    @Query("SELECT AVG(p.totalTimeSpentSeconds) FROM UserOnboardingProgress p " +
           "WHERE p.flow.id = :flowId AND p.status = 'COMPLETED'")
    Double avgCompletionTimeByFlow(@Param("flowId") Long flowId);

    @Query("SELECT AVG(p.completionRating) FROM UserOnboardingProgress p " +
           "WHERE p.flow.id = :flowId AND p.completionRating IS NOT NULL")
    Double avgRatingByFlow(@Param("flowId") Long flowId);

    // Reminder queries
    @Query("SELECT p FROM UserOnboardingProgress p WHERE p.status = 'PAUSED' " +
           "AND p.reminderSent = false AND p.updatedAt < :cutoff")
    List<UserOnboardingProgress> findForReminder(@Param("cutoff") Instant cutoff);

    void deleteByUserId(Long userId);
}

@Repository
interface ChecklistRepository extends JpaRepository<Checklist, Long> {

    Optional<Checklist> findBySlug(String slug);

    List<Checklist> findByTargetRoleAndActiveTrue(OnboardingFlow.TargetRole role);

    @Query("SELECT c FROM Checklist c WHERE c.active = true " +
           "AND (c.targetRole = :role OR c.targetRole = 'ALL') " +
           "AND (c.organizationId IS NULL OR c.organizationId = :orgId)")
    List<Checklist> findAvailableChecklists(@Param("role") OnboardingFlow.TargetRole role,
                                            @Param("orgId") Long organizationId);

    @Query("SELECT c FROM Checklist c WHERE c.active = true AND c.showInDashboard = true " +
           "AND (c.targetRole = :role OR c.targetRole = 'ALL') " +
           "AND (c.organizationId IS NULL OR c.organizationId = :orgId)")
    List<Checklist> findDashboardChecklists(@Param("role") OnboardingFlow.TargetRole role,
                                            @Param("orgId") Long organizationId);

    List<Checklist> findByOrganizationIdAndActiveTrue(Long organizationId);
}

@Repository
interface ChecklistItemRepository extends JpaRepository<ChecklistItem, Long> {

    List<ChecklistItem> findByChecklistIdAndActiveTrueOrderByOrderIndexAsc(Long checklistId);

    Optional<ChecklistItem> findByChecklistIdAndFlowSlug(Long checklistId, String flowSlug);
}

@Repository
interface UserChecklistProgressRepository extends JpaRepository<UserChecklistProgress, Long> {

    Optional<UserChecklistProgress> findByUserIdAndChecklistId(Long userId, Long checklistId);

    List<UserChecklistProgress> findByUserId(Long userId);

    @Query("SELECT p FROM UserChecklistProgress p WHERE p.userId = :userId AND p.completed = false AND p.dismissed = false")
    List<UserChecklistProgress> findActiveByUser(@Param("userId") Long userId);

    @Query("SELECT p FROM UserChecklistProgress p WHERE p.userId = :userId AND p.completed = true")
    List<UserChecklistProgress> findCompletedByUser(@Param("userId") Long userId);

    @Query("SELECT SUM(p.pointsEarned) FROM UserChecklistProgress p WHERE p.userId = :userId")
    Integer sumPointsByUser(@Param("userId") Long userId);

    void deleteByUserId(Long userId);
}

@Repository
interface ContextualHelpRepository extends JpaRepository<ContextualHelp, Long> {

    Optional<ContextualHelp> findByKey(String key);

    List<ContextualHelp> findByPageRouteAndActiveTrue(String pageRoute);

    @Query("SELECT h FROM ContextualHelp h WHERE h.active = true AND h.pageRoute = :route " +
           "AND (h.targetRoles IS EMPTY OR :role MEMBER OF h.targetRoles)")
    List<ContextualHelp> findByPageRouteAndRole(@Param("route") String pageRoute,
                                                 @Param("role") OnboardingFlow.TargetRole role);

    @Query("SELECT h FROM ContextualHelp h WHERE h.active = true " +
           "AND (h.targetRoles IS EMPTY OR :role MEMBER OF h.targetRoles) " +
           "ORDER BY h.priority DESC")
    List<ContextualHelp> findByRole(@Param("role") OnboardingFlow.TargetRole role);

    List<ContextualHelp> findByActiveTrueOrderByPriorityDesc();
}

@Repository
interface UserHelpDismissalRepository extends JpaRepository<UserHelpDismissal, Long> {

    Optional<UserHelpDismissal> findByUserIdAndHelpKey(Long userId, String helpKey);

    List<UserHelpDismissal> findByUserId(Long userId);

    @Query("SELECT d.helpKey FROM UserHelpDismissal d WHERE d.userId = :userId")
    Set<String> findDismissedKeysByUser(@Param("userId") Long userId);

    void deleteByUserId(Long userId);
}

// Entity for tracking dismissed help
@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "user_help_dismissals",
        uniqueConstraints = @jakarta.persistence.UniqueConstraint(columnNames = {"user_id", "help_key"}))
@lombok.Data
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
@lombok.Builder
class UserHelpDismissal {

    @jakarta.persistence.Id
    @jakarta.persistence.GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @jakarta.persistence.Column(name = "user_id", nullable = false)
    private Long userId;

    @jakarta.persistence.Column(name = "help_key", nullable = false)
    private String helpKey;

    @org.hibernate.annotations.CreationTimestamp
    @jakarta.persistence.Column(name = "dismissed_at", updatable = false)
    private java.time.Instant dismissedAt;
}
