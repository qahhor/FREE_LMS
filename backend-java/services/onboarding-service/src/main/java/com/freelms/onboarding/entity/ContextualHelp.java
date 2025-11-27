package com.freelms.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.*;

/**
 * Smartup LMS - Contextual Help Entity
 *
 * Provides contextual tooltips and help throughout the application.
 */
@Entity
@Table(name = "contextual_help")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContextualHelp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String key; // Unique identifier for the help item

    @Column(name = "page_route")
    private String pageRoute; // Page where help appears

    @Column(name = "target_element")
    private String targetElement; // CSS selector

    // Content
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

    // Display
    @Enumerated(EnumType.STRING)
    @Column(name = "help_type")
    private HelpType helpType = HelpType.TOOLTIP;

    @Enumerated(EnumType.STRING)
    private OnboardingStep.TooltipPosition position = OnboardingStep.TooltipPosition.BOTTOM;

    @Column(name = "icon")
    private String icon;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "video_url")
    private String videoUrl;

    // Trigger
    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type")
    private TriggerType triggerType = TriggerType.HOVER;

    @Column(name = "trigger_delay_ms")
    private Integer triggerDelayMs = 0;

    // Visibility
    @ElementCollection
    @CollectionTable(name = "contextual_help_roles", joinColumns = @JoinColumn(name = "help_id"))
    @Column(name = "role")
    @Enumerated(EnumType.STRING)
    private Set<OnboardingFlow.TargetRole> targetRoles = new HashSet<>();

    @Column(name = "show_once")
    private boolean showOnce = false;

    @Column(name = "dismissible")
    private boolean dismissible = true;

    @Column(name = "active")
    private boolean active = true;

    @Column(name = "priority")
    private Integer priority = 0;

    // Related content
    @Column(name = "related_docs_url")
    private String relatedDocsUrl;

    @Column(name = "related_video_url")
    private String relatedVideoUrl;

    @Column(name = "related_flow_slug")
    private String relatedFlowSlug; // Related onboarding flow

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public enum HelpType {
        TOOLTIP,           // Small tooltip
        POPOVER,           // Larger popover
        MODAL,             // Modal dialog
        SIDEBAR,           // Side panel
        INLINE,            // Inline help text
        BADGE              // Info badge/icon
    }

    public enum TriggerType {
        HOVER,             // On mouse hover
        CLICK,             // On click
        FOCUS,             // On focus (inputs)
        AUTO,              // Auto-show on page load
        FIRST_VISIT,       // First time visiting page
        HELP_BUTTON        // Click on help button
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
