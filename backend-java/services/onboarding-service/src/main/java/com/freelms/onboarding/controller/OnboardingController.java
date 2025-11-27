package com.freelms.onboarding.controller;

import com.freelms.onboarding.dto.*;
import com.freelms.onboarding.entity.*;
import com.freelms.onboarding.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Smartup LMS - Onboarding Controller
 *
 * User-facing API for onboarding flows and progress tracking.
 */
@RestController
@RequestMapping("/api/v1/onboarding")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Onboarding", description = "User onboarding API")
public class OnboardingController {

    private final OnboardingService onboardingService;

    // ================== Flow Endpoints ==================

    @GetMapping("/flows")
    @Operation(summary = "Get available onboarding flows for user")
    public ResponseEntity<OnboardingResponse<List<FlowSummaryDto>>> getAvailableFlows(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "LEARNER") String role,
            @RequestHeader(value = "X-Organization-Id", required = false) Long organizationId,
            @RequestHeader(value = "Accept-Language", defaultValue = "ru") String locale) {

        OnboardingFlow.TargetRole targetRole = OnboardingFlow.TargetRole.valueOf(role.toUpperCase());
        List<OnboardingFlow> flows = onboardingService.getAvailableFlows(targetRole, organizationId);

        List<FlowSummaryDto> dtos = flows.stream()
                .map(f -> FlowSummaryDto.builder()
                        .id(f.getId())
                        .slug(f.getSlug())
                        .name(f.getLocalizedName(locale))
                        .description(f.getDescription())
                        .targetRole(f.getTargetRole())
                        .estimatedMinutes(f.getEstimatedMinutes())
                        .totalSteps(f.getTotalSteps())
                        .completionPoints(f.getCompletionPoints())
                        .mandatory(f.isMandatory())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(OnboardingResponse.success(dtos));
    }

    @GetMapping("/flows/{slug}")
    @Operation(summary = "Get flow details by slug")
    public ResponseEntity<OnboardingResponse<FlowDto>> getFlow(
            @PathVariable String slug,
            @RequestHeader(value = "Accept-Language", defaultValue = "ru") String locale) {

        return onboardingService.getFlowBySlug(slug)
                .map(f -> {
                    FlowDto dto = FlowDto.builder()
                            .id(f.getId())
                            .slug(f.getSlug())
                            .name(f.getLocalizedName(locale))
                            .description(f.getDescription())
                            .targetRole(f.getTargetRole())
                            .estimatedMinutes(f.getEstimatedMinutes())
                            .totalSteps(f.getTotalSteps())
                            .completionPoints(f.getCompletionPoints())
                            .mandatory(f.isMandatory())
                            .canSkip(f.isCanSkip())
                            .showProgress(f.isShowProgress())
                            .steps(f.getSteps().stream()
                                    .map(s -> StepDto.builder()
                                            .id(s.getId())
                                            .orderIndex(s.getOrderIndex())
                                            .title(s.getLocalizedTitle(locale))
                                            .content(s.getLocalizedContent(locale))
                                            .stepType(s.getStepType())
                                            .actionType(s.getActionType())
                                            .targetElement(s.getTargetElement())
                                            .targetPage(s.getTargetPage())
                                            .position(s.getPosition())
                                            .imageUrl(s.getImageUrl())
                                            .videoUrl(s.getVideoUrl())
                                            .icon(s.getIcon())
                                            .completionTrigger(s.getCompletionTrigger())
                                            .points(s.getPoints())
                                            .canSkip(s.isCanSkip())
                                            .build())
                                    .collect(Collectors.toList()))
                            .build();
                    return ResponseEntity.ok(OnboardingResponse.success(dto));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ================== Progress Endpoints ==================

    @PostMapping("/flows/{slug}/start")
    @Operation(summary = "Start an onboarding flow")
    public ResponseEntity<OnboardingResponse<ProgressDto>> startFlow(
            @PathVariable String slug,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody(required = false) StartFlowRequest request) {

        if (request == null) {
            request = new StartFlowRequest();
        }
        request.setUserId(userId);

        UserOnboardingProgress progress = onboardingService.startFlow(userId, slug, request);
        return ResponseEntity.ok(OnboardingResponse.success(toProgressDto(progress), "Onboarding started"));
    }

    @GetMapping("/progress")
    @Operation(summary = "Get user's onboarding progress")
    public ResponseEntity<OnboardingResponse<UserProgressSummary>> getUserProgress(
            @RequestHeader("X-User-Id") Long userId) {

        UserProgressSummary summary = onboardingService.getUserProgressSummary(userId);
        return ResponseEntity.ok(OnboardingResponse.success(summary));
    }

    @GetMapping("/progress/{progressId}")
    @Operation(summary = "Get active onboarding state")
    public ResponseEntity<OnboardingResponse<ActiveOnboardingState>> getActiveState(
            @PathVariable Long progressId,
            @RequestHeader("X-User-Id") Long userId) {

        ActiveOnboardingState state = onboardingService.getActiveState(userId, progressId);
        return ResponseEntity.ok(OnboardingResponse.success(state));
    }

    @PostMapping("/progress/{progressId}/complete-step")
    @Operation(summary = "Complete current step")
    public ResponseEntity<OnboardingResponse<ProgressDto>> completeStep(
            @PathVariable Long progressId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody CompleteStepRequest request) {

        UserOnboardingProgress progress = onboardingService.completeStep(userId, progressId, request);
        return ResponseEntity.ok(OnboardingResponse.success(toProgressDto(progress), "Step completed"));
    }

    @PostMapping("/progress/{progressId}/skip-step")
    @Operation(summary = "Skip current step")
    public ResponseEntity<OnboardingResponse<ProgressDto>> skipStep(
            @PathVariable Long progressId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody SkipStepRequest request) {

        UserOnboardingProgress progress = onboardingService.skipStep(userId, progressId, request);
        return ResponseEntity.ok(OnboardingResponse.success(toProgressDto(progress), "Step skipped"));
    }

    @PostMapping("/progress/{progressId}/previous")
    @Operation(summary = "Go to previous step")
    public ResponseEntity<OnboardingResponse<ProgressDto>> previousStep(
            @PathVariable Long progressId,
            @RequestHeader("X-User-Id") Long userId) {

        UserOnboardingProgress progress = onboardingService.goToPreviousStep(userId, progressId);
        return ResponseEntity.ok(OnboardingResponse.success(toProgressDto(progress)));
    }

    @PostMapping("/progress/{progressId}/complete")
    @Operation(summary = "Complete the onboarding flow")
    public ResponseEntity<OnboardingResponse<ProgressDto>> completeFlow(
            @PathVariable Long progressId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody(required = false) CompleteFlowRequest request) {

        if (request == null) {
            request = new CompleteFlowRequest();
        }

        UserOnboardingProgress progress = onboardingService.completeFlow(userId, progressId, request);
        return ResponseEntity.ok(OnboardingResponse.success(toProgressDto(progress), "Onboarding completed!"));
    }

    @PostMapping("/progress/{progressId}/dismiss")
    @Operation(summary = "Dismiss the onboarding flow")
    public ResponseEntity<OnboardingResponse<ProgressDto>> dismissFlow(
            @PathVariable Long progressId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody(required = false) DismissFlowRequest request) {

        if (request == null) {
            request = new DismissFlowRequest();
        }

        UserOnboardingProgress progress = onboardingService.dismissFlow(userId, progressId, request);
        return ResponseEntity.ok(OnboardingResponse.success(toProgressDto(progress), "Onboarding dismissed"));
    }

    // ================== Checklist Endpoints ==================

    @GetMapping("/checklists")
    @Operation(summary = "Get user's checklists")
    public ResponseEntity<OnboardingResponse<List<ChecklistDto>>> getChecklists(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "LEARNER") String role,
            @RequestHeader(value = "X-Organization-Id", required = false) Long organizationId,
            @RequestHeader(value = "Accept-Language", defaultValue = "ru") String locale) {

        OnboardingFlow.TargetRole targetRole = OnboardingFlow.TargetRole.valueOf(role.toUpperCase());
        List<Checklist> checklists = onboardingService.getUserChecklists(userId, targetRole, organizationId);

        List<ChecklistDto> dtos = checklists.stream()
                .map(c -> ChecklistDto.builder()
                        .id(c.getId())
                        .slug(c.getSlug())
                        .name(c.getName())
                        .description(c.getDescription())
                        .targetRole(c.getTargetRole())
                        .icon(c.getIcon())
                        .color(c.getColor())
                        .completionPoints(c.getCompletionPoints())
                        .showInDashboard(c.isShowInDashboard())
                        .collapsible(c.isCollapsible())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(OnboardingResponse.success(dtos));
    }

    @GetMapping("/checklists/{slug}/progress")
    @Operation(summary = "Get checklist progress")
    public ResponseEntity<OnboardingResponse<ChecklistProgressDto>> getChecklistProgress(
            @PathVariable String slug,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "Accept-Language", defaultValue = "ru") String locale) {

        ChecklistProgressDto progress = onboardingService.getChecklistProgress(userId, slug, locale);
        return ResponseEntity.ok(OnboardingResponse.success(progress));
    }

    @PostMapping("/checklists/{checklistId}/items/{itemId}/complete")
    @Operation(summary = "Mark checklist item as complete")
    public ResponseEntity<OnboardingResponse<String>> completeChecklistItem(
            @PathVariable Long checklistId,
            @PathVariable Long itemId,
            @RequestHeader("X-User-Id") Long userId) {

        onboardingService.completeChecklistItem(userId, checklistId, itemId);
        return ResponseEntity.ok(OnboardingResponse.success("Completed", "Item completed"));
    }

    @PostMapping("/checklists/{checklistId}/dismiss")
    @Operation(summary = "Dismiss a checklist")
    public ResponseEntity<OnboardingResponse<String>> dismissChecklist(
            @PathVariable Long checklistId,
            @RequestHeader("X-User-Id") Long userId) {

        onboardingService.dismissChecklist(userId, checklistId);
        return ResponseEntity.ok(OnboardingResponse.success("Dismissed", "Checklist dismissed"));
    }

    // ================== Contextual Help Endpoints ==================

    @GetMapping("/help")
    @Operation(summary = "Get contextual help for current page")
    public ResponseEntity<OnboardingResponse<List<ContextualHelpDto>>> getPageHelp(
            @RequestParam String page,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "LEARNER") String role,
            @RequestHeader(value = "Accept-Language", defaultValue = "ru") String locale) {

        OnboardingFlow.TargetRole targetRole = OnboardingFlow.TargetRole.valueOf(role.toUpperCase());
        List<ContextualHelpDto> helps = onboardingService.getPageHelp(userId, page, targetRole, locale);
        return ResponseEntity.ok(OnboardingResponse.success(helps));
    }

    @PostMapping("/help/{helpKey}/dismiss")
    @Operation(summary = "Dismiss a contextual help item")
    public ResponseEntity<OnboardingResponse<String>> dismissHelp(
            @PathVariable String helpKey,
            @RequestHeader("X-User-Id") Long userId) {

        onboardingService.dismissHelp(userId, helpKey);
        return ResponseEntity.ok(OnboardingResponse.success("Dismissed", "Help dismissed"));
    }

    // ================== Helper Methods ==================

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
}
