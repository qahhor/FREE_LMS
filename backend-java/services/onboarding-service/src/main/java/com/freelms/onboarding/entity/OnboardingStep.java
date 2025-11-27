package com.freelms.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.*;

/**
 * Smartup LMS - Onboarding Step Entity
 *
 * Individual step within an onboarding flow.
 */
@Entity
@Table(name = "onboarding_steps")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flow_id", nullable = false)
    private OnboardingFlow flow;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(nullable = false)
    private String title;

    @Column(name = "title_uz")
    private String titleUz;

    @Column(name = "title_ru")
    private String titleRu;

    @Column(name = "title_en")
    private String titleEn;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "content_uz", columnDefinition = "TEXT")
    private String contentUz;

    @Column(name = "content_ru", columnDefinition = "TEXT")
    private String contentRu;

    @Column(name = "content_en", columnDefinition = "TEXT")
    private String contentEn;

    // Step type and behavior
    @Enumerated(EnumType.STRING)
    @Column(name = "step_type", nullable = false)
    private StepType stepType = StepType.TOOLTIP;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type")
    private ActionType actionType = ActionType.NEXT;

    // UI targeting
    @Column(name = "target_element")
    private String targetElement; // CSS selector

    @Column(name = "target_page")
    private String targetPage; // Route/URL

    @Enumerated(EnumType.STRING)
    @Column(name = "position")
    private TooltipPosition position = TooltipPosition.BOTTOM;

    // Media
    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "gif_url")
    private String gifUrl;

    @Column(name = "icon")
    private String icon;

    // Interaction
    @Column(name = "click_target")
    private String clickTarget; // Element to click

    @Column(name = "input_target")
    private String inputTarget; // Element to fill

    @Column(name = "expected_value")
    private String expectedValue; // Expected input value

    @Column(name = "highlight_elements")
    private String highlightElements; // JSON array of selectors

    // Validation
    @Enumerated(EnumType.STRING)
    @Column(name = "completion_trigger")
    private CompletionTrigger completionTrigger = CompletionTrigger.BUTTON_CLICK;

    @Column(name = "validation_selector")
    private String validationSelector;

    @Column(name = "validation_value")
    private String validationValue;

    // Timing
    @Column(name = "delay_ms")
    private Integer delayMs = 0;

    @Column(name = "auto_advance_ms")
    private Integer autoAdvanceMs; // Auto advance after X ms

    @Column(name = "timeout_ms")
    private Integer timeoutMs;

    // Rewards
    @Column(name = "points")
    private Integer points = 10;

    // Behavior
    @Column(name = "can_skip")
    private boolean canSkip = true;

    @Column(name = "show_back_button")
    private boolean showBackButton = true;

    @Column(name = "show_skip_button")
    private boolean showSkipButton = true;

    @Column(name = "block_ui")
    private boolean blockUi = false; // Prevent other interactions

    @Column(name = "scroll_to_element")
    private boolean scrollToElement = true;

    // Custom actions
    @Column(name = "before_show_action", columnDefinition = "TEXT")
    private String beforeShowAction; // JavaScript/callback

    @Column(name = "after_complete_action", columnDefinition = "TEXT")
    private String afterCompleteAction;

    @Column(name = "on_skip_action", columnDefinition = "TEXT")
    private String onSkipAction;

    // Conditional display
    @Column(name = "condition", columnDefinition = "TEXT")
    private String condition; // JSON condition expression

    @Column(name = "active")
    private boolean active = true;

    public enum StepType {
        TOOLTIP,           // Small popup near element
        MODAL,             // Center modal dialog
        SPOTLIGHT,         // Highlight element with overlay
        SIDEBAR,           // Slide-in panel
        FULLSCREEN,        // Full screen overlay
        VIDEO,             // Video tutorial
        CHECKLIST,         // Checklist of items
        INTERACTIVE,       // Interactive task
        QUIZ,              // Quick quiz question
        WELCOME,           // Welcome screen
        CELEBRATION        // Completion celebration
    }

    public enum ActionType {
        NEXT,              // Continue to next step
        CLICK,             // Click on element
        INPUT,             // Type in field
        SELECT,            // Select option
        NAVIGATE,          // Navigate to page
        COMPLETE,          // Complete onboarding
        CUSTOM             // Custom action
    }

    public enum TooltipPosition {
        TOP,
        TOP_LEFT,
        TOP_RIGHT,
        BOTTOM,
        BOTTOM_LEFT,
        BOTTOM_RIGHT,
        LEFT,
        RIGHT,
        CENTER
    }

    public enum CompletionTrigger {
        BUTTON_CLICK,      // Click "Next" button
        ELEMENT_CLICK,     // Click specific element
        INPUT_FILLED,      // Fill input field
        OPTION_SELECTED,   // Select option
        PAGE_LOADED,       // Page navigation
        CUSTOM_EVENT,      // Custom JS event
        TIMEOUT,           // Auto-advance after timeout
        VIDEO_WATCHED      // Video completed
    }

    public String getLocalizedTitle(String locale) {
        return switch (locale) {
            case "uz" -> titleUz != null ? titleUz : title;
            case "en" -> titleEn != null ? titleEn : title;
            default -> titleRu != null ? titleRu : title;
        };
    }

    public String getLocalizedContent(String locale) {
        return switch (locale) {
            case "uz" -> contentUz != null ? contentUz : content;
            case "en" -> contentEn != null ? contentEn : content;
            default -> contentRu != null ? contentRu : content;
        };
    }
}
