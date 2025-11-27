package com.freelms.onboarding.dto;

import com.freelms.onboarding.entity.*;
import lombok.*;

import java.time.Instant;
import java.util.*;

/**
 * Smartup LMS - Onboarding DTOs
 */

// ============ Flow DTOs ============

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingDtos {
    // Marker class for organizing DTOs
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class FlowDto {
    private Long id;
    private String slug;
    private String name;
    private String description;
    private OnboardingFlow.TargetRole targetRole;
    private Integer estimatedMinutes;
    private Integer totalSteps;
    private Integer completionPoints;
    private boolean mandatory;
    private boolean canSkip;
    private boolean showProgress;
    private List<StepDto> steps;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class FlowSummaryDto {
    private Long id;
    private String slug;
    private String name;
    private String description;
    private OnboardingFlow.TargetRole targetRole;
    private Integer estimatedMinutes;
    private Integer totalSteps;
    private Integer completionPoints;
    private boolean mandatory;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class CreateFlowRequest {
    private String slug;
    private String name;
    private String nameUz;
    private String nameRu;
    private String nameEn;
    private String description;
    private String descriptionUz;
    private String descriptionRu;
    private String descriptionEn;
    private OnboardingFlow.TargetRole targetRole;
    private Long organizationId;
    private Integer estimatedMinutes;
    private Integer completionPoints;
    private Long completionBadgeId;
    private boolean mandatory;
    private boolean canSkip;
    private boolean showProgress;
    private boolean autoStart;
    private Set<String> prerequisiteFlows;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class UpdateFlowRequest {
    private String name;
    private String nameUz;
    private String nameRu;
    private String nameEn;
    private String description;
    private String descriptionUz;
    private String descriptionRu;
    private String descriptionEn;
    private Integer estimatedMinutes;
    private Integer completionPoints;
    private Long completionBadgeId;
    private boolean mandatory;
    private boolean canSkip;
    private boolean showProgress;
    private boolean autoStart;
    private Set<String> prerequisiteFlows;
}

// ============ Step DTOs ============

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class StepDto {
    private Long id;
    private Integer orderIndex;
    private String title;
    private String content;
    private OnboardingStep.StepType stepType;
    private OnboardingStep.ActionType actionType;
    private String targetElement;
    private String targetPage;
    private OnboardingStep.TooltipPosition position;
    private String imageUrl;
    private String videoUrl;
    private String gifUrl;
    private String icon;
    private String clickTarget;
    private String inputTarget;
    private OnboardingStep.CompletionTrigger completionTrigger;
    private Integer delayMs;
    private Integer autoAdvanceMs;
    private Integer points;
    private boolean canSkip;
    private boolean showBackButton;
    private boolean showSkipButton;
    private boolean blockUi;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class CreateStepRequest {
    private String title;
    private String titleUz;
    private String titleRu;
    private String titleEn;
    private String content;
    private String contentUz;
    private String contentRu;
    private String contentEn;
    private OnboardingStep.StepType stepType;
    private OnboardingStep.ActionType actionType;
    private String targetElement;
    private String targetPage;
    private OnboardingStep.TooltipPosition position;
    private String imageUrl;
    private String videoUrl;
    private String gifUrl;
    private String icon;
    private String clickTarget;
    private String inputTarget;
    private String expectedValue;
    private String highlightElements;
    private OnboardingStep.CompletionTrigger completionTrigger;
    private String validationSelector;
    private String validationValue;
    private Integer delayMs;
    private Integer autoAdvanceMs;
    private Integer timeoutMs;
    private Integer points;
    private boolean canSkip;
    private boolean showBackButton;
    private boolean showSkipButton;
    private boolean blockUi;
    private boolean scrollToElement;
    private String beforeShowAction;
    private String afterCompleteAction;
    private String onSkipAction;
    private String condition;
}

// ============ Progress DTOs ============

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class ProgressDto {
    private Long id;
    private Long userId;
    private Long flowId;
    private String flowSlug;
    private String flowName;
    private UserOnboardingProgress.ProgressStatus status;
    private Integer currentStepIndex;
    private Long currentStepId;
    private Integer completedSteps;
    private Integer skippedSteps;
    private Integer totalSteps;
    private Double progressPercent;
    private Integer pointsEarned;
    private boolean badgeEarned;
    private Long totalTimeSpentSeconds;
    private Instant startedAt;
    private Instant completedAt;
    private boolean canContinue;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class UserProgressSummary {
    private Long userId;
    private Integer totalFlows;
    private Integer completedFlows;
    private Integer inProgressFlows;
    private Integer totalPoints;
    private Integer badgesEarned;
    private Double overallProgress;
    private List<ProgressDto> flows;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class StartFlowRequest {
    private Long userId;
    private Long organizationId;
    private String deviceType;
    private String browser;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class CompleteStepRequest {
    private Long stepId;
    private Long timeSpentSeconds;
    private Map<String, Object> stepData;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class SkipStepRequest {
    private Long stepId;
    private String reason;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class DismissFlowRequest {
    private String reason;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class CompleteFlowRequest {
    private String feedback;
    private Integer rating;
}

// ============ Checklist DTOs ============

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class ChecklistDto {
    private Long id;
    private String slug;
    private String name;
    private String description;
    private OnboardingFlow.TargetRole targetRole;
    private String icon;
    private String color;
    private Integer completionPoints;
    private boolean showInDashboard;
    private boolean collapsible;
    private List<ChecklistItemDto> items;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class ChecklistItemDto {
    private Long id;
    private Integer orderIndex;
    private String title;
    private String description;
    private String icon;
    private String actionType;
    private String actionUrl;
    private String flowSlug;
    private String completionType;
    private Integer points;
    private boolean required;
    private boolean completed;
    private Instant completedAt;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class ChecklistProgressDto {
    private Long checklistId;
    private String checklistSlug;
    private String checklistName;
    private Double progressPercent;
    private boolean completed;
    private Integer pointsEarned;
    private List<ChecklistItemDto> items;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class CompleteChecklistItemRequest {
    private Long itemId;
}

// ============ Contextual Help DTOs ============

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class ContextualHelpDto {
    private Long id;
    private String key;
    private String pageRoute;
    private String targetElement;
    private String title;
    private String content;
    private ContextualHelp.HelpType helpType;
    private OnboardingStep.TooltipPosition position;
    private String icon;
    private String imageUrl;
    private String videoUrl;
    private ContextualHelp.TriggerType triggerType;
    private Integer triggerDelayMs;
    private boolean showOnce;
    private boolean dismissible;
    private String relatedDocsUrl;
    private String relatedVideoUrl;
    private String relatedFlowSlug;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class PageHelpRequest {
    private String pageRoute;
    private Long userId;
    private OnboardingFlow.TargetRole userRole;
    private String locale;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class DismissHelpRequest {
    private Long userId;
    private String helpKey;
}

// ============ Analytics DTOs ============

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class OnboardingAnalytics {
    private Long organizationId;
    private Integer totalUsers;
    private Integer completedUsers;
    private Integer inProgressUsers;
    private Integer skippedUsers;
    private Double averageCompletionRate;
    private Double averageTimeToComplete;
    private Map<String, FlowAnalytics> flowStats;
    private List<StepDropoffPoint> dropoffPoints;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class FlowAnalytics {
    private String flowSlug;
    private String flowName;
    private Integer totalStarted;
    private Integer totalCompleted;
    private Integer totalSkipped;
    private Double completionRate;
    private Double averageTimeSeconds;
    private Integer averageRating;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class StepDropoffPoint {
    private Long stepId;
    private String stepTitle;
    private Integer dropoffCount;
    private Double dropoffRate;
}

// ============ Template DTOs ============

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class FlowTemplateDto {
    private String templateId;
    private String name;
    private String description;
    private OnboardingFlow.TargetRole targetRole;
    private Integer estimatedMinutes;
    private List<StepTemplateDto> steps;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class StepTemplateDto {
    private String title;
    private String content;
    private OnboardingStep.StepType stepType;
    private OnboardingStep.ActionType actionType;
    private String targetElement;
    private String targetPage;
    private OnboardingStep.TooltipPosition position;
    private String icon;
    private OnboardingStep.CompletionTrigger completionTrigger;
    private Integer points;
}

// ============ Response Wrappers ============

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class OnboardingResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private Map<String, Object> meta;

    public static <T> OnboardingResponse<T> success(T data) {
        return OnboardingResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    public static <T> OnboardingResponse<T> success(T data, String message) {
        return OnboardingResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> OnboardingResponse<T> error(String message) {
        return OnboardingResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class ActiveOnboardingState {
    private ProgressDto progress;
    private StepDto currentStep;
    private StepDto nextStep;
    private boolean hasNextStep;
    private boolean hasPreviousStep;
    private Integer remainingSteps;
    private Integer estimatedRemainingMinutes;
}
