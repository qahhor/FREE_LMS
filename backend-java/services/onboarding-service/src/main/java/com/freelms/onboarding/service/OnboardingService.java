package com.freelms.onboarding.service;

import com.freelms.onboarding.dto.*;
import com.freelms.onboarding.entity.*;
import com.freelms.onboarding.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Smartup LMS - Onboarding Service
 *
 * Manages onboarding flows, user progress, and contextual help.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OnboardingService {

    private final OnboardingFlowRepository flowRepository;
    private final OnboardingStepRepository stepRepository;
    private final UserOnboardingProgressRepository progressRepository;
    private final ChecklistRepository checklistRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final UserChecklistProgressRepository checklistProgressRepository;
    private final ContextualHelpRepository helpRepository;
    private final UserHelpDismissalRepository helpDismissalRepository;

    // ================== Flow Management ==================

    public OnboardingFlow createFlow(CreateFlowRequest request) {
        OnboardingFlow flow = OnboardingFlow.builder()
                .slug(request.getSlug())
                .name(request.getName())
                .nameUz(request.getNameUz())
                .nameRu(request.getNameRu())
                .nameEn(request.getNameEn())
                .description(request.getDescription())
                .descriptionUz(request.getDescriptionUz())
                .descriptionRu(request.getDescriptionRu())
                .descriptionEn(request.getDescriptionEn())
                .targetRole(request.getTargetRole())
                .organizationId(request.getOrganizationId())
                .estimatedMinutes(request.getEstimatedMinutes())
                .completionPoints(request.getCompletionPoints() != null ? request.getCompletionPoints() : 100)
                .completionBadgeId(request.getCompletionBadgeId())
                .mandatory(request.isMandatory())
                .canSkip(request.isCanSkip())
                .showProgress(request.isShowProgress())
                .autoStart(request.isAutoStart())
                .prerequisiteFlows(request.getPrerequisiteFlows() != null ? request.getPrerequisiteFlows() : new HashSet<>())
                .build();

        return flowRepository.save(flow);
    }

    public OnboardingFlow updateFlow(Long flowId, UpdateFlowRequest request) {
        OnboardingFlow flow = flowRepository.findById(flowId)
                .orElseThrow(() -> new IllegalArgumentException("Flow not found: " + flowId));

        if (request.getName() != null) flow.setName(request.getName());
        if (request.getNameUz() != null) flow.setNameUz(request.getNameUz());
        if (request.getNameRu() != null) flow.setNameRu(request.getNameRu());
        if (request.getNameEn() != null) flow.setNameEn(request.getNameEn());
        if (request.getDescription() != null) flow.setDescription(request.getDescription());
        if (request.getEstimatedMinutes() != null) flow.setEstimatedMinutes(request.getEstimatedMinutes());
        if (request.getCompletionPoints() != null) flow.setCompletionPoints(request.getCompletionPoints());
        if (request.getCompletionBadgeId() != null) flow.setCompletionBadgeId(request.getCompletionBadgeId());
        flow.setMandatory(request.isMandatory());
        flow.setCanSkip(request.isCanSkip());
        flow.setShowProgress(request.isShowProgress());
        flow.setAutoStart(request.isAutoStart());
        if (request.getPrerequisiteFlows() != null) flow.setPrerequisiteFlows(request.getPrerequisiteFlows());

        return flowRepository.save(flow);
    }

    public void publishFlow(Long flowId) {
        OnboardingFlow flow = flowRepository.findById(flowId)
                .orElseThrow(() -> new IllegalArgumentException("Flow not found: " + flowId));
        flow.setPublished(true);
        flow.setPublishedAt(Instant.now());
        flow.setVersion(flow.getVersion() + 1);
        flowRepository.save(flow);
    }

    public void unpublishFlow(Long flowId) {
        OnboardingFlow flow = flowRepository.findById(flowId)
                .orElseThrow(() -> new IllegalArgumentException("Flow not found: " + flowId));
        flow.setPublished(false);
        flowRepository.save(flow);
    }

    public void deleteFlow(Long flowId) {
        flowRepository.deleteById(flowId);
    }

    public Optional<OnboardingFlow> getFlow(Long flowId) {
        return flowRepository.findById(flowId);
    }

    public Optional<OnboardingFlow> getFlowBySlug(String slug) {
        return flowRepository.findBySlugAndActiveTrue(slug);
    }

    public List<OnboardingFlow> getAvailableFlows(OnboardingFlow.TargetRole role, Long organizationId) {
        return flowRepository.findAvailableFlows(role, organizationId);
    }

    // ================== Step Management ==================

    public OnboardingStep addStep(Long flowId, CreateStepRequest request) {
        OnboardingFlow flow = flowRepository.findById(flowId)
                .orElseThrow(() -> new IllegalArgumentException("Flow not found: " + flowId));

        OnboardingStep step = OnboardingStep.builder()
                .title(request.getTitle())
                .titleUz(request.getTitleUz())
                .titleRu(request.getTitleRu())
                .titleEn(request.getTitleEn())
                .content(request.getContent())
                .contentUz(request.getContentUz())
                .contentRu(request.getContentRu())
                .contentEn(request.getContentEn())
                .stepType(request.getStepType() != null ? request.getStepType() : OnboardingStep.StepType.TOOLTIP)
                .actionType(request.getActionType() != null ? request.getActionType() : OnboardingStep.ActionType.NEXT)
                .targetElement(request.getTargetElement())
                .targetPage(request.getTargetPage())
                .position(request.getPosition() != null ? request.getPosition() : OnboardingStep.TooltipPosition.BOTTOM)
                .imageUrl(request.getImageUrl())
                .videoUrl(request.getVideoUrl())
                .gifUrl(request.getGifUrl())
                .icon(request.getIcon())
                .clickTarget(request.getClickTarget())
                .inputTarget(request.getInputTarget())
                .expectedValue(request.getExpectedValue())
                .highlightElements(request.getHighlightElements())
                .completionTrigger(request.getCompletionTrigger() != null ? request.getCompletionTrigger() : OnboardingStep.CompletionTrigger.BUTTON_CLICK)
                .validationSelector(request.getValidationSelector())
                .validationValue(request.getValidationValue())
                .delayMs(request.getDelayMs() != null ? request.getDelayMs() : 0)
                .autoAdvanceMs(request.getAutoAdvanceMs())
                .timeoutMs(request.getTimeoutMs())
                .points(request.getPoints() != null ? request.getPoints() : 10)
                .canSkip(request.isCanSkip())
                .showBackButton(request.isShowBackButton())
                .showSkipButton(request.isShowSkipButton())
                .blockUi(request.isBlockUi())
                .scrollToElement(request.isScrollToElement())
                .beforeShowAction(request.getBeforeShowAction())
                .afterCompleteAction(request.getAfterCompleteAction())
                .onSkipAction(request.getOnSkipAction())
                .condition(request.getCondition())
                .build();

        flow.addStep(step);
        flowRepository.save(flow);

        return step;
    }

    public void removeStep(Long flowId, Long stepId) {
        OnboardingFlow flow = flowRepository.findById(flowId)
                .orElseThrow(() -> new IllegalArgumentException("Flow not found: " + flowId));

        OnboardingStep step = stepRepository.findById(stepId)
                .orElseThrow(() -> new IllegalArgumentException("Step not found: " + stepId));

        flow.removeStep(step);
        flowRepository.save(flow);
    }

    public void reorderSteps(Long flowId, List<Long> stepIds) {
        OnboardingFlow flow = flowRepository.findById(flowId)
                .orElseThrow(() -> new IllegalArgumentException("Flow not found: " + flowId));

        for (int i = 0; i < stepIds.size(); i++) {
            Long stepId = stepIds.get(i);
            for (OnboardingStep step : flow.getSteps()) {
                if (step.getId().equals(stepId)) {
                    step.setOrderIndex(i + 1);
                    break;
                }
            }
        }

        flowRepository.save(flow);
    }

    // ================== User Progress ==================

    public UserOnboardingProgress startFlow(Long userId, String flowSlug, StartFlowRequest request) {
        OnboardingFlow flow = flowRepository.findBySlugAndActiveTrue(flowSlug)
                .orElseThrow(() -> new IllegalArgumentException("Flow not found: " + flowSlug));

        // Check if already started
        Optional<UserOnboardingProgress> existing = progressRepository.findByUserIdAndFlowId(userId, flow.getId());
        if (existing.isPresent()) {
            UserOnboardingProgress progress = existing.get();
            if (progress.canContinue()) {
                progress.startSession();
                return progressRepository.save(progress);
            }
            return progress;
        }

        // Check prerequisites
        if (!flow.getPrerequisiteFlows().isEmpty()) {
            for (String prereqSlug : flow.getPrerequisiteFlows()) {
                Optional<OnboardingFlow> prereqFlow = flowRepository.findBySlugAndActiveTrue(prereqSlug);
                if (prereqFlow.isPresent()) {
                    Optional<UserOnboardingProgress> prereqProgress =
                            progressRepository.findByUserIdAndFlowId(userId, prereqFlow.get().getId());
                    if (prereqProgress.isEmpty() || !prereqProgress.get().isCompleted()) {
                        throw new IllegalStateException("Prerequisite flow not completed: " + prereqSlug);
                    }
                }
            }
        }

        // Create new progress
        List<OnboardingStep> steps = stepRepository.findByFlowIdAndActiveTrueOrderByOrderIndexAsc(flow.getId());
        Long firstStepId = steps.isEmpty() ? null : steps.get(0).getId();

        UserOnboardingProgress progress = UserOnboardingProgress.builder()
                .userId(userId)
                .organizationId(request.getOrganizationId())
                .flow(flow)
                .status(UserOnboardingProgress.ProgressStatus.IN_PROGRESS)
                .currentStepIndex(0)
                .currentStepId(firstStepId)
                .totalSteps(steps.size())
                .deviceType(request.getDeviceType())
                .browser(request.getBrowser())
                .build();

        progress.startSession();
        return progressRepository.save(progress);
    }

    public ActiveOnboardingState getActiveState(Long userId, Long progressId) {
        UserOnboardingProgress progress = progressRepository.findById(progressId)
                .orElseThrow(() -> new IllegalArgumentException("Progress not found: " + progressId));

        if (!progress.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Progress does not belong to user");
        }

        List<OnboardingStep> steps = stepRepository.findByFlowIdAndActiveTrueOrderByOrderIndexAsc(
                progress.getFlow().getId());

        OnboardingStep currentStep = steps.stream()
                .filter(s -> s.getId().equals(progress.getCurrentStepId()))
                .findFirst()
                .orElse(steps.isEmpty() ? null : steps.get(progress.getCurrentStepIndex()));

        OnboardingStep nextStep = null;
        boolean hasNext = false;
        if (currentStep != null) {
            int currentIdx = steps.indexOf(currentStep);
            if (currentIdx < steps.size() - 1) {
                nextStep = steps.get(currentIdx + 1);
                hasNext = true;
            }
        }

        boolean hasPrevious = progress.getCurrentStepIndex() > 0;
        int remaining = progress.getTotalSteps() - progress.getCompletedSteps() - progress.getSkippedSteps();

        return ActiveOnboardingState.builder()
                .progress(toProgressDto(progress))
                .currentStep(currentStep != null ? toStepDto(currentStep, "ru") : null)
                .nextStep(nextStep != null ? toStepDto(nextStep, "ru") : null)
                .hasNextStep(hasNext)
                .hasPreviousStep(hasPrevious)
                .remainingSteps(remaining)
                .estimatedRemainingMinutes(remaining * 2) // ~2 min per step
                .build();
    }

    public UserOnboardingProgress completeStep(Long userId, Long progressId, CompleteStepRequest request) {
        UserOnboardingProgress progress = progressRepository.findById(progressId)
                .orElseThrow(() -> new IllegalArgumentException("Progress not found: " + progressId));

        if (!progress.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Progress does not belong to user");
        }

        OnboardingStep step = stepRepository.findById(request.getStepId())
                .orElseThrow(() -> new IllegalArgumentException("Step not found: " + request.getStepId()));

        progress.completeStep(step.getId(), request.getTimeSpentSeconds(), step.getPoints());

        // Move to next step
        List<OnboardingStep> steps = stepRepository.findByFlowIdAndActiveTrueOrderByOrderIndexAsc(
                progress.getFlow().getId());
        int currentIdx = progress.getCurrentStepIndex();
        if (currentIdx < steps.size() - 1) {
            progress.setCurrentStepIndex(currentIdx + 1);
            progress.setCurrentStepId(steps.get(currentIdx + 1).getId());
        }

        return progressRepository.save(progress);
    }

    public UserOnboardingProgress skipStep(Long userId, Long progressId, SkipStepRequest request) {
        UserOnboardingProgress progress = progressRepository.findById(progressId)
                .orElseThrow(() -> new IllegalArgumentException("Progress not found: " + progressId));

        if (!progress.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Progress does not belong to user");
        }

        OnboardingStep step = stepRepository.findById(request.getStepId())
                .orElseThrow(() -> new IllegalArgumentException("Step not found: " + request.getStepId()));

        if (!step.isCanSkip()) {
            throw new IllegalStateException("This step cannot be skipped");
        }

        progress.skipStep(step.getId());

        // Move to next step
        List<OnboardingStep> steps = stepRepository.findByFlowIdAndActiveTrueOrderByOrderIndexAsc(
                progress.getFlow().getId());
        int currentIdx = progress.getCurrentStepIndex();
        if (currentIdx < steps.size() - 1) {
            progress.setCurrentStepIndex(currentIdx + 1);
            progress.setCurrentStepId(steps.get(currentIdx + 1).getId());
        }

        return progressRepository.save(progress);
    }

    public UserOnboardingProgress goToPreviousStep(Long userId, Long progressId) {
        UserOnboardingProgress progress = progressRepository.findById(progressId)
                .orElseThrow(() -> new IllegalArgumentException("Progress not found: " + progressId));

        if (!progress.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Progress does not belong to user");
        }

        if (progress.getCurrentStepIndex() > 0) {
            List<OnboardingStep> steps = stepRepository.findByFlowIdAndActiveTrueOrderByOrderIndexAsc(
                    progress.getFlow().getId());
            int newIdx = progress.getCurrentStepIndex() - 1;
            progress.setCurrentStepIndex(newIdx);
            progress.setCurrentStepId(steps.get(newIdx).getId());
            return progressRepository.save(progress);
        }

        return progress;
    }

    public UserOnboardingProgress completeFlow(Long userId, Long progressId, CompleteFlowRequest request) {
        UserOnboardingProgress progress = progressRepository.findById(progressId)
                .orElseThrow(() -> new IllegalArgumentException("Progress not found: " + progressId));

        if (!progress.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Progress does not belong to user");
        }

        progress.setStatus(UserOnboardingProgress.ProgressStatus.COMPLETED);
        progress.setCompletedAt(Instant.now());
        progress.setCompletionFeedback(request.getFeedback());
        progress.setCompletionRating(request.getRating());
        progress.setProgressPercent(100.0);
        progress.setPointsEarned(progress.getPointsEarned() + progress.getFlow().getCompletionPoints());
        progress.setBadgeEarned(progress.getFlow().getCompletionBadgeId() != null);

        return progressRepository.save(progress);
    }

    public UserOnboardingProgress dismissFlow(Long userId, Long progressId, DismissFlowRequest request) {
        UserOnboardingProgress progress = progressRepository.findById(progressId)
                .orElseThrow(() -> new IllegalArgumentException("Progress not found: " + progressId));

        if (!progress.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Progress does not belong to user");
        }

        if (progress.getFlow().isMandatory() && !progress.getFlow().isCanSkip()) {
            throw new IllegalStateException("This flow is mandatory and cannot be dismissed");
        }

        progress.dismiss(request.getReason());
        return progressRepository.save(progress);
    }

    public List<UserOnboardingProgress> getUserProgress(Long userId) {
        return progressRepository.findByUserId(userId);
    }

    public UserProgressSummary getUserProgressSummary(Long userId) {
        List<UserOnboardingProgress> allProgress = progressRepository.findByUserId(userId);

        int completed = (int) allProgress.stream()
                .filter(p -> p.getStatus() == UserOnboardingProgress.ProgressStatus.COMPLETED)
                .count();

        int inProgress = (int) allProgress.stream()
                .filter(p -> p.getStatus() == UserOnboardingProgress.ProgressStatus.IN_PROGRESS ||
                        p.getStatus() == UserOnboardingProgress.ProgressStatus.PAUSED)
                .count();

        int totalPoints = allProgress.stream()
                .mapToInt(UserOnboardingProgress::getPointsEarned)
                .sum();

        int badgesEarned = (int) allProgress.stream()
                .filter(UserOnboardingProgress::isBadgeEarned)
                .count();

        double overallProgress = allProgress.isEmpty() ? 0 :
                allProgress.stream().mapToDouble(UserOnboardingProgress::getProgressPercent).average().orElse(0);

        return UserProgressSummary.builder()
                .userId(userId)
                .totalFlows(allProgress.size())
                .completedFlows(completed)
                .inProgressFlows(inProgress)
                .totalPoints(totalPoints)
                .badgesEarned(badgesEarned)
                .overallProgress(overallProgress)
                .flows(allProgress.stream().map(this::toProgressDto).collect(Collectors.toList()))
                .build();
    }

    // ================== Checklists ==================

    public List<Checklist> getUserChecklists(Long userId, OnboardingFlow.TargetRole role, Long organizationId) {
        return checklistRepository.findAvailableChecklists(role, organizationId);
    }

    public ChecklistProgressDto getChecklistProgress(Long userId, String checklistSlug, String locale) {
        Checklist checklist = checklistRepository.findBySlug(checklistSlug)
                .orElseThrow(() -> new IllegalArgumentException("Checklist not found: " + checklistSlug));

        UserChecklistProgress progress = checklistProgressRepository
                .findByUserIdAndChecklistId(userId, checklist.getId())
                .orElseGet(() -> {
                    UserChecklistProgress newProgress = UserChecklistProgress.builder()
                            .userId(userId)
                            .checklist(checklist)
                            .build();
                    return checklistProgressRepository.save(newProgress);
                });

        List<ChecklistItem> items = checklistItemRepository
                .findByChecklistIdAndActiveTrueOrderByOrderIndexAsc(checklist.getId());

        List<ChecklistItemDto> itemDtos = items.stream()
                .map(item -> ChecklistItemDto.builder()
                        .id(item.getId())
                        .orderIndex(item.getOrderIndex())
                        .title(item.getLocalizedTitle(locale))
                        .description(item.getDescription())
                        .icon(item.getIcon())
                        .actionType(item.getActionType().name())
                        .actionUrl(item.getActionUrl())
                        .flowSlug(item.getFlowSlug())
                        .completionType(item.getCompletionType().name())
                        .points(item.getPoints())
                        .required(item.isRequired())
                        .completed(progress.getCompletedItems().containsKey(item.getId()))
                        .completedAt(progress.getCompletedItems().get(item.getId()))
                        .build())
                .collect(Collectors.toList());

        return ChecklistProgressDto.builder()
                .checklistId(checklist.getId())
                .checklistSlug(checklist.getSlug())
                .checklistName(checklist.getName())
                .progressPercent(progress.getProgressPercent())
                .completed(progress.isCompleted())
                .pointsEarned(progress.getPointsEarned())
                .items(itemDtos)
                .build();
    }

    public UserChecklistProgress completeChecklistItem(Long userId, Long checklistId, Long itemId) {
        Checklist checklist = checklistRepository.findById(checklistId)
                .orElseThrow(() -> new IllegalArgumentException("Checklist not found: " + checklistId));

        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + itemId));

        UserChecklistProgress progress = checklistProgressRepository
                .findByUserIdAndChecklistId(userId, checklistId)
                .orElseGet(() -> UserChecklistProgress.builder()
                        .userId(userId)
                        .checklist(checklist)
                        .build());

        if (!progress.getCompletedItems().containsKey(itemId)) {
            progress.completeItem(itemId, item.getPoints());
        }

        return checklistProgressRepository.save(progress);
    }

    public void dismissChecklist(Long userId, Long checklistId) {
        UserChecklistProgress progress = checklistProgressRepository
                .findByUserIdAndChecklistId(userId, checklistId)
                .orElseThrow(() -> new IllegalArgumentException("Progress not found"));

        progress.setDismissed(true);
        progress.setDismissedAt(Instant.now());
        checklistProgressRepository.save(progress);
    }

    // ================== Contextual Help ==================

    public List<ContextualHelpDto> getPageHelp(Long userId, String pageRoute, OnboardingFlow.TargetRole role, String locale) {
        List<ContextualHelp> helps = helpRepository.findByPageRouteAndRole(pageRoute, role);
        Set<String> dismissedKeys = helpDismissalRepository.findDismissedKeysByUser(userId);

        return helps.stream()
                .filter(h -> !h.isShowOnce() || !dismissedKeys.contains(h.getKey()))
                .map(h -> toHelpDto(h, locale))
                .collect(Collectors.toList());
    }

    public void dismissHelp(Long userId, String helpKey) {
        if (helpDismissalRepository.findByUserIdAndHelpKey(userId, helpKey).isEmpty()) {
            UserHelpDismissal dismissal = UserHelpDismissal.builder()
                    .userId(userId)
                    .helpKey(helpKey)
                    .build();
            helpDismissalRepository.save(dismissal);
        }
    }

    // ================== Analytics ==================

    public OnboardingAnalytics getOrganizationAnalytics(Long organizationId) {
        List<UserOnboardingProgress> allProgress = progressRepository.findByOrganizationId(organizationId);

        Set<Long> uniqueUsers = allProgress.stream()
                .map(UserOnboardingProgress::getUserId)
                .collect(Collectors.toSet());

        int completed = (int) allProgress.stream()
                .filter(p -> p.getStatus() == UserOnboardingProgress.ProgressStatus.COMPLETED)
                .map(UserOnboardingProgress::getUserId)
                .distinct()
                .count();

        int inProgress = (int) allProgress.stream()
                .filter(p -> p.getStatus() == UserOnboardingProgress.ProgressStatus.IN_PROGRESS)
                .map(UserOnboardingProgress::getUserId)
                .distinct()
                .count();

        int skipped = (int) allProgress.stream()
                .filter(p -> p.getStatus() == UserOnboardingProgress.ProgressStatus.SKIPPED ||
                        p.getStatus() == UserOnboardingProgress.ProgressStatus.DISMISSED)
                .map(UserOnboardingProgress::getUserId)
                .distinct()
                .count();

        double avgCompletion = allProgress.stream()
                .mapToDouble(UserOnboardingProgress::getProgressPercent)
                .average()
                .orElse(0);

        double avgTime = allProgress.stream()
                .filter(p -> p.getStatus() == UserOnboardingProgress.ProgressStatus.COMPLETED)
                .mapToLong(UserOnboardingProgress::getTotalTimeSpentSeconds)
                .average()
                .orElse(0);

        return OnboardingAnalytics.builder()
                .organizationId(organizationId)
                .totalUsers(uniqueUsers.size())
                .completedUsers(completed)
                .inProgressUsers(inProgress)
                .skippedUsers(skipped)
                .averageCompletionRate(avgCompletion)
                .averageTimeToComplete(avgTime)
                .build();
    }

    // ================== DTO Converters ==================

    private ProgressDto toProgressDto(UserOnboardingProgress progress) {
        return ProgressDto.builder()
                .id(progress.getId())
                .userId(progress.getUserId())
                .flowId(progress.getFlow().getId())
                .flowSlug(progress.getFlow().getSlug())
                .flowName(progress.getFlow().getName())
                .status(progress.getStatus())
                .currentStepIndex(progress.getCurrentStepIndex())
                .currentStepId(progress.getCurrentStepId())
                .completedSteps(progress.getCompletedSteps())
                .skippedSteps(progress.getSkippedSteps())
                .totalSteps(progress.getTotalSteps())
                .progressPercent(progress.getProgressPercent())
                .pointsEarned(progress.getPointsEarned())
                .badgeEarned(progress.isBadgeEarned())
                .totalTimeSpentSeconds(progress.getTotalTimeSpentSeconds())
                .startedAt(progress.getStartedAt())
                .completedAt(progress.getCompletedAt())
                .canContinue(progress.canContinue())
                .build();
    }

    private StepDto toStepDto(OnboardingStep step, String locale) {
        return StepDto.builder()
                .id(step.getId())
                .orderIndex(step.getOrderIndex())
                .title(step.getLocalizedTitle(locale))
                .content(step.getLocalizedContent(locale))
                .stepType(step.getStepType())
                .actionType(step.getActionType())
                .targetElement(step.getTargetElement())
                .targetPage(step.getTargetPage())
                .position(step.getPosition())
                .imageUrl(step.getImageUrl())
                .videoUrl(step.getVideoUrl())
                .gifUrl(step.getGifUrl())
                .icon(step.getIcon())
                .clickTarget(step.getClickTarget())
                .inputTarget(step.getInputTarget())
                .completionTrigger(step.getCompletionTrigger())
                .delayMs(step.getDelayMs())
                .autoAdvanceMs(step.getAutoAdvanceMs())
                .points(step.getPoints())
                .canSkip(step.isCanSkip())
                .showBackButton(step.isShowBackButton())
                .showSkipButton(step.isShowSkipButton())
                .blockUi(step.isBlockUi())
                .build();
    }

    private ContextualHelpDto toHelpDto(ContextualHelp help, String locale) {
        return ContextualHelpDto.builder()
                .id(help.getId())
                .key(help.getKey())
                .pageRoute(help.getPageRoute())
                .targetElement(help.getTargetElement())
                .title(help.getLocalizedTitle(locale))
                .content(help.getLocalizedContent(locale))
                .helpType(help.getHelpType())
                .position(help.getPosition())
                .icon(help.getIcon())
                .imageUrl(help.getImageUrl())
                .videoUrl(help.getVideoUrl())
                .triggerType(help.getTriggerType())
                .triggerDelayMs(help.getTriggerDelayMs())
                .showOnce(help.isShowOnce())
                .dismissible(help.isDismissible())
                .relatedDocsUrl(help.getRelatedDocsUrl())
                .relatedVideoUrl(help.getRelatedVideoUrl())
                .relatedFlowSlug(help.getRelatedFlowSlug())
                .build();
    }
}
