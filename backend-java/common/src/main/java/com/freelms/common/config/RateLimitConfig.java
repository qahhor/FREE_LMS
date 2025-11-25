package com.freelms.common.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting configuration for API protection.
 * Designed for: 200 clients, 100,000 users, 1000 concurrent users
 *
 * Rate limits:
 * - Anonymous: 100 requests/minute
 * - Authenticated: 1000 requests/minute
 * - Admin: 5000 requests/minute
 */
@Configuration
@Component
public class RateLimitConfig {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // Rate limit tiers
    public static final int ANONYMOUS_REQUESTS_PER_MINUTE = 100;
    public static final int USER_REQUESTS_PER_MINUTE = 1000;
    public static final int ADMIN_REQUESTS_PER_MINUTE = 5000;

    // Burst allowance (25% extra for short bursts)
    public static final int ANONYMOUS_BURST = 125;
    public static final int USER_BURST = 1250;
    public static final int ADMIN_BURST = 6250;

    /**
     * Get or create rate limit bucket for anonymous users (by IP)
     */
    public Bucket resolveBucketForAnonymous(String clientIp) {
        return buckets.computeIfAbsent("anon:" + clientIp, key -> createAnonymousBucket());
    }

    /**
     * Get or create rate limit bucket for authenticated users
     */
    public Bucket resolveBucketForUser(Long userId) {
        return buckets.computeIfAbsent("user:" + userId, key -> createUserBucket());
    }

    /**
     * Get or create rate limit bucket for admin users
     */
    public Bucket resolveBucketForAdmin(Long userId) {
        return buckets.computeIfAbsent("admin:" + userId, key -> createAdminBucket());
    }

    private Bucket createAnonymousBucket() {
        Bandwidth limit = Bandwidth.classic(
            ANONYMOUS_BURST,
            Refill.greedy(ANONYMOUS_REQUESTS_PER_MINUTE, Duration.ofMinutes(1))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createUserBucket() {
        Bandwidth limit = Bandwidth.classic(
            USER_BURST,
            Refill.greedy(USER_REQUESTS_PER_MINUTE, Duration.ofMinutes(1))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createAdminBucket() {
        Bandwidth limit = Bandwidth.classic(
            ADMIN_BURST,
            Refill.greedy(ADMIN_REQUESTS_PER_MINUTE, Duration.ofMinutes(1))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Clear expired buckets (call periodically)
     */
    public void clearExpiredBuckets() {
        // In production, use Redis-based buckets with TTL
        // This is a simplified in-memory implementation
        if (buckets.size() > 100000) {
            buckets.clear();
        }
    }
}
