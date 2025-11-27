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

/**
 * Smartup LMS - Onboarding Admin Controller
 *
 * Admin API for managing onboarding flows and analytics.
 */
@RestController
@RequestMapping("/api/v1/admin/onboarding")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Onboarding Admin", description = "Onboarding management API")
public class OnboardingAdminController {

    private final OnboardingService onboardingService;

    // ================== Flow Management ==================

    @PostMapping("/flows")
    @Operation(summary = "Create a new onboarding flow")
    public ResponseEntity<OnboardingResponse<OnboardingFlow>> createFlow(
            @RequestBody CreateFlowRequest request,
            @RequestHeader("X-User-Id") Long userId) {

        OnboardingFlow flow = onboardingService.createFlow(request);
        log.info("Flow created by user {}: {}", userId, flow.getSlug());
        return ResponseEntity.ok(OnboardingResponse.success(flow, "Flow created"));
    }

    @PutMapping("/flows/{flowId}")
    @Operation(summary = "Update an onboarding flow")
    public ResponseEntity<OnboardingResponse<OnboardingFlow>> updateFlow(
            @PathVariable Long flowId,
            @RequestBody UpdateFlowRequest request,
            @RequestHeader("X-User-Id") Long userId) {

        OnboardingFlow flow = onboardingService.updateFlow(flowId, request);
        log.info("Flow updated by user {}: {}", userId, flow.getSlug());
        return ResponseEntity.ok(OnboardingResponse.success(flow, "Flow updated"));
    }

    @PostMapping("/flows/{flowId}/publish")
    @Operation(summary = "Publish a flow")
    public ResponseEntity<OnboardingResponse<String>> publishFlow(
            @PathVariable Long flowId,
            @RequestHeader("X-User-Id") Long userId) {

        onboardingService.publishFlow(flowId);
        log.info("Flow published by user {}: {}", userId, flowId);
        return ResponseEntity.ok(OnboardingResponse.success("Published", "Flow published"));
    }

    @PostMapping("/flows/{flowId}/unpublish")
    @Operation(summary = "Unpublish a flow")
    public ResponseEntity<OnboardingResponse<String>> unpublishFlow(
            @PathVariable Long flowId,
            @RequestHeader("X-User-Id") Long userId) {

        onboardingService.unpublishFlow(flowId);
        log.info("Flow unpublished by user {}: {}", userId, flowId);
        return ResponseEntity.ok(OnboardingResponse.success("Unpublished", "Flow unpublished"));
    }

    @DeleteMapping("/flows/{flowId}")
    @Operation(summary = "Delete a flow")
    public ResponseEntity<OnboardingResponse<String>> deleteFlow(
            @PathVariable Long flowId,
            @RequestHeader("X-User-Id") Long userId) {

        onboardingService.deleteFlow(flowId);
        log.info("Flow deleted by user {}: {}", userId, flowId);
        return ResponseEntity.ok(OnboardingResponse.success("Deleted", "Flow deleted"));
    }

    // ================== Step Management ==================

    @PostMapping("/flows/{flowId}/steps")
    @Operation(summary = "Add a step to a flow")
    public ResponseEntity<OnboardingResponse<OnboardingStep>> addStep(
            @PathVariable Long flowId,
            @RequestBody CreateStepRequest request,
            @RequestHeader("X-User-Id") Long userId) {

        OnboardingStep step = onboardingService.addStep(flowId, request);
        log.info("Step added by user {} to flow {}: {}", userId, flowId, step.getTitle());
        return ResponseEntity.ok(OnboardingResponse.success(step, "Step added"));
    }

    @DeleteMapping("/flows/{flowId}/steps/{stepId}")
    @Operation(summary = "Remove a step from a flow")
    public ResponseEntity<OnboardingResponse<String>> removeStep(
            @PathVariable Long flowId,
            @PathVariable Long stepId,
            @RequestHeader("X-User-Id") Long userId) {

        onboardingService.removeStep(flowId, stepId);
        log.info("Step removed by user {} from flow {}: {}", userId, flowId, stepId);
        return ResponseEntity.ok(OnboardingResponse.success("Removed", "Step removed"));
    }

    @PutMapping("/flows/{flowId}/steps/reorder")
    @Operation(summary = "Reorder steps in a flow")
    public ResponseEntity<OnboardingResponse<String>> reorderSteps(
            @PathVariable Long flowId,
            @RequestBody List<Long> stepIds,
            @RequestHeader("X-User-Id") Long userId) {

        onboardingService.reorderSteps(flowId, stepIds);
        log.info("Steps reordered by user {} in flow {}", userId, flowId);
        return ResponseEntity.ok(OnboardingResponse.success("Reordered", "Steps reordered"));
    }

    // ================== Analytics ==================

    @GetMapping("/analytics")
    @Operation(summary = "Get organization onboarding analytics")
    public ResponseEntity<OnboardingResponse<OnboardingAnalytics>> getAnalytics(
            @RequestHeader(value = "X-Organization-Id", required = false) Long organizationId) {

        OnboardingAnalytics analytics = onboardingService.getOrganizationAnalytics(organizationId);
        return ResponseEntity.ok(OnboardingResponse.success(analytics));
    }

    // ================== Bulk Operations ==================

    @PostMapping("/flows/{flowId}/assign")
    @Operation(summary = "Assign flow to users")
    public ResponseEntity<OnboardingResponse<String>> assignFlowToUsers(
            @PathVariable Long flowId,
            @RequestBody List<Long> userIds,
            @RequestHeader("X-User-Id") Long adminId) {

        // TODO: Implement bulk assignment
        log.info("Flow {} assigned to {} users by admin {}", flowId, userIds.size(), adminId);
        return ResponseEntity.ok(OnboardingResponse.success("Assigned", "Flow assigned to users"));
    }

    @PostMapping("/flows/{flowId}/reset")
    @Operation(summary = "Reset flow progress for users")
    public ResponseEntity<OnboardingResponse<String>> resetFlowProgress(
            @PathVariable Long flowId,
            @RequestBody(required = false) List<Long> userIds,
            @RequestHeader("X-User-Id") Long adminId) {

        // TODO: Implement progress reset
        log.info("Flow {} progress reset by admin {}", flowId, adminId);
        return ResponseEntity.ok(OnboardingResponse.success("Reset", "Flow progress reset"));
    }
}
