package com.freelms.lms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Free LMS - Enterprise Learning Management System
 * Monolithic Application Entry Point
 *
 * This application consolidates all microservices into a single deployable unit
 * while maintaining modular internal structure for maintainability.
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableCaching
@EnableAsync
@EnableScheduling
@EnableTransactionManagement
public class FreeLmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(FreeLmsApplication.class, args);
    }
}
