package com.freelms.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.*;

/**
 * Smartup LMS - Getting Started Checklist Entity
 *
 * Defines checklists for user onboarding and feature discovery.
 */
@Entity
@Table(name = "onboarding_checklists")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Checklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(name = "name_uz")
    private String nameUz;

    @Column(name = "name_ru")
    private String nameRu;

    @Column(name = "name_en")
    private String nameEn;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_role", nullable = false)
    private OnboardingFlow.TargetRole targetRole;

    @Column(name = "organization_id")
    private Long organizationId;

    @OneToMany(mappedBy = "checklist", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<ChecklistItem> items = new ArrayList<>();

    @Column(name = "icon")
    private String icon;

    @Column(name = "color")
    private String color;

    @Column(name = "completion_points")
    private Integer completionPoints = 50;

    @Column(name = "show_in_dashboard")
    private boolean showInDashboard = true;

    @Column(name = "collapsible")
    private boolean collapsible = true;

    @Column(name = "auto_dismiss_on_complete")
    private boolean autoDismissOnComplete = false;

    @Column(name = "active")
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public void addItem(ChecklistItem item) {
        items.add(item);
        item.setChecklist(this);
        item.setOrderIndex(items.size());
    }
}

@Entity
@Table(name = "checklist_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class ChecklistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checklist_id", nullable = false)
    private Checklist checklist;

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
    private String description;

    @Column(name = "icon")
    private String icon;

    // Action
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type")
    private ActionType actionType = ActionType.NAVIGATE;

    @Column(name = "action_url")
    private String actionUrl;

    @Column(name = "action_params")
    private String actionParams; // JSON

    @Column(name = "flow_slug")
    private String flowSlug; // Start specific onboarding flow

    // Completion
    @Enumerated(EnumType.STRING)
    @Column(name = "completion_type")
    private CompletionType completionType = CompletionType.MANUAL;

    @Column(name = "completion_event")
    private String completionEvent; // Event name to track

    @Column(name = "completion_endpoint")
    private String completionEndpoint; // API to check

    // Rewards
    @Column(name = "points")
    private Integer points = 10;

    @Column(name = "required")
    private boolean required = false;

    @Column(name = "active")
    private boolean active = true;

    public enum ActionType {
        NAVIGATE,          // Navigate to page
        OPEN_MODAL,        // Open modal
        START_FLOW,        // Start onboarding flow
        EXTERNAL_LINK,     // Open external link
        CUSTOM             // Custom action
    }

    public enum CompletionType {
        MANUAL,            // User marks as complete
        AUTO_DETECT,       // Detect via event
        API_CHECK,         // Check via API
        PAGE_VISIT,        // Visit specific page
        ACTION_COMPLETE    // Complete specific action
    }

    public String getLocalizedTitle(String locale) {
        return switch (locale) {
            case "uz" -> titleUz != null ? titleUz : title;
            case "en" -> titleEn != null ? titleEn : title;
            default -> titleRu != null ? titleRu : title;
        };
    }
}

@Entity
@Table(name = "user_checklist_progress",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "checklist_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class UserChecklistProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checklist_id", nullable = false)
    private Checklist checklist;

    @ElementCollection
    @CollectionTable(name = "user_checklist_completions", joinColumns = @JoinColumn(name = "progress_id"))
    @MapKeyColumn(name = "item_id")
    @Column(name = "completed_at")
    private Map<Long, Instant> completedItems = new HashMap<>();

    @Column(name = "progress_percent")
    private Double progressPercent = 0.0;

    @Column(name = "completed")
    private boolean completed = false;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "dismissed")
    private boolean dismissed = false;

    @Column(name = "dismissed_at")
    private Instant dismissedAt;

    @Column(name = "points_earned")
    private Integer pointsEarned = 0;

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private Instant startedAt;

    public void completeItem(Long itemId, int points) {
        completedItems.put(itemId, Instant.now());
        pointsEarned += points;
        updateProgress();
    }

    private void updateProgress() {
        int totalItems = checklist.getItems().size();
        if (totalItems > 0) {
            progressPercent = (completedItems.size() * 100.0) / totalItems;
            if (completedItems.size() >= totalItems) {
                completed = true;
                completedAt = Instant.now();
            }
        }
    }
}
