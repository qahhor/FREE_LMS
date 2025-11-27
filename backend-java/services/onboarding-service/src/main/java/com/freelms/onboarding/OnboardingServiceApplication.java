package com.freelms.onboarding;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Smartup LMS - Onboarding Service
 *
 * Provides comprehensive user onboarding functionality:
 * - Role-based onboarding flows
 * - Interactive guided tours
 * - Step-by-step tutorials
 * - Progress tracking and analytics
 * - Contextual help and tooltips
 * - Gamified onboarding experience
 */
@SpringBootApplication(scanBasePackages = {"com.freelms.onboarding", "com.freelms.common"})
@EnableDiscoveryClient
@EnableCaching
@EnableAsync
public class OnboardingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OnboardingServiceApplication.class, args);
    }
}
