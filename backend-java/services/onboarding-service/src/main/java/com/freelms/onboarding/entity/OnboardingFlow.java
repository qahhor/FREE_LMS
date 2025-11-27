package com.freelms.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.*;

/**
 * Smartup LMS - Onboarding Flow Entity
 *
 * Defines a complete onboarding journey for a specific user role.
 */
@Entity
@Table(name = "onboarding_flows")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingFlow {

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

    @Column(name = "description_uz", columnDefinition = "TEXT")
    private String descriptionUz;

    @Column(name = "description_ru", columnDefinition = "TEXT")
    private String descriptionRu;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    // Target audience
    @Enumerated(EnumType.STRING)
    @Column(name = "target_role", nullable = false)
    private TargetRole targetRole;

    @Column(name = "organization_id")
    private Long organizationId; // null = global template

    // Flow structure
    @OneToMany(mappedBy = "flow", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<OnboardingStep> steps = new ArrayList<>();

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Column(name = "total_steps")
    private Integer totalSteps;

    // Rewards
    @Column(name = "completion_points")
    private Integer completionPoints = 100;

    @Column(name = "completion_badge_id")
    private Long completionBadgeId;

    // Behavior
    @Column(name = "is_mandatory")
    private boolean mandatory = true;

    @Column(name = "can_skip")
    private boolean canSkip = false;

    @Column(name = "show_progress")
    private boolean showProgress = true;

    @Column(name = "auto_start")
    private boolean autoStart = true;

    // Conditions
    @Column(name = "min_platform_version")
    private String minPlatformVersion;

    @ElementCollection
    @CollectionTable(name = "flow_prerequisites", joinColumns = @JoinColumn(name = "flow_id"))
    @Column(name = "prerequisite_flow_slug")
    private Set<String> prerequisiteFlows = new HashSet<>();

    // Status
    @Column(name = "active")
    private boolean active = true;

    @Column(name = "published")
    private boolean published = false;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "version")
    private Integer version = 1;

    // Timestamps
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    public enum TargetRole {
        LEARNER,           // Regular student/learner
        INSTRUCTOR,        // Course instructor/teacher
        MANAGER,           // Team/department manager
        HR_ADMIN,          // HR administrator
        CONTENT_CREATOR,   // Content author
        SYSTEM_ADMIN,      // System administrator
        ORGANIZATION_ADMIN, // Organization admin
        MENTOR,            // Mentor
        GUEST,             // Guest user
        ALL                // All users
    }

    // Helper methods
    public void addStep(OnboardingStep step) {
        steps.add(step);
        step.setFlow(this);
        step.setOrderIndex(steps.size());
        this.totalSteps = steps.size();
    }

    public void removeStep(OnboardingStep step) {
        steps.remove(step);
        step.setFlow(null);
        reorderSteps();
    }

    private void reorderSteps() {
        for (int i = 0; i < steps.size(); i++) {
            steps.get(i).setOrderIndex(i + 1);
        }
        this.totalSteps = steps.size();
    }

    public String getLocalizedName(String locale) {
        return switch (locale) {
            case "uz" -> nameUz != null ? nameUz : name;
            case "en" -> nameEn != null ? nameEn : name;
            default -> nameRu != null ? nameRu : name;
        };
    }
}
