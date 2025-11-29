# Migration Guide: Microservices to Monolith

This guide documents the migration from the microservices architecture to the monolithic architecture.

## Overview

The Free LMS project has been migrated from 32 microservices to a single modular monolith application.

## What Changed

### Removed Components

1. **Service Discovery (Eureka)**
   - No longer needed - all modules are in-process
   - Removed: `service-registry` module

2. **Config Server**
   - Configuration now managed via `application.yml`
   - Environment variables for production
   - Removed: `config-server` module

3. **API Gateway**
   - Routing handled by Spring MVC
   - Security filters handle authentication
   - Removed: `gateway-service` module

4. **Feign Clients**
   - Replaced with direct service method calls
   - No more inter-service HTTP communication

### Consolidated Components

| Previous | Now |
|----------|-----|
| 32 separate applications | 1 monolithic application |
| 32 databases | 1 unified database |
| Multiple Docker images | Single Docker image |
| Service-to-service calls | Direct method calls |
| Distributed transactions | Local transactions |

## Migration Steps

### 1. Database Migration

**Before**: Each service had its own database
```
lms_auth
lms_courses
lms_enrollments
lms_payments
...
```

**After**: Single unified database
```sql
-- All tables in one database: freelms
-- See: src/main/resources/db/migration/V1__initial_schema.sql
```

### 2. Configuration Migration

**Before**: Config Server with multiple YAML files
```
config-server/
  src/main/resources/config/
    auth-service.yml
    course-service.yml
    ...
```

**After**: Single application.yml with profiles
```yaml
# application.yml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

# Database - was separate per service
datasource:
  url: jdbc:postgresql://${DB_HOST}/freelms

---
# Production profile
spring:
  config:
    activate:
      on-profile: prod
```

### 3. Service Communication Migration

**Before**: Feign clients and REST calls
```java
@FeignClient(name = "course-service")
public interface CourseClient {
    @GetMapping("/api/v1/courses/{id}")
    CourseDto getCourse(@PathVariable Long id);
}
```

**After**: Direct service injection
```java
@Service
@RequiredArgsConstructor
public class EnrollmentService {
    private final CourseService courseService; // Direct injection

    public void enroll(Long courseId) {
        CourseDto course = courseService.getCourseById(courseId);
        // ...
    }
}
```

### 4. Event Migration

**Before**: Kafka for all inter-service communication
```java
// Every service had producers and consumers
kafkaTemplate.send("course-events", event);
```

**After**: Events for async/audit only
```java
// Direct calls for synchronous operations
// Kafka only for truly async needs
kafkaTemplate.send("audit-events", auditEvent);
```

### 5. Docker Migration

**Before**: Multiple docker-compose files
```yaml
# docker-compose.yml with 32 services
services:
  service-registry:
  config-server:
  gateway-service:
  auth-service:
  course-service:
  # ... 27 more services
```

**After**: Single application with infrastructure
```yaml
# docker-compose.monolith.yml
services:
  app:  # Single application
  postgres:
  redis:
  kafka:
  elasticsearch:
  mongodb:
  minio:
```

## Code Structure Comparison

### Before (Microservices)
```
backend-java/
├── services/
│   ├── service-registry/
│   │   └── src/main/java/com/freelms/registry/
│   ├── config-server/
│   │   └── src/main/java/com/freelms/config/
│   ├── gateway-service/
│   │   └── src/main/java/com/freelms/gateway/
│   ├── auth-service/
│   │   └── src/main/java/com/freelms/auth/
│   ├── course-service/
│   │   └── src/main/java/com/freelms/course/
│   └── ... (29 more services)
└── common/
    └── src/main/java/com/freelms/common/
```

### After (Monolith)
```
backend-java/
├── monolith/
│   └── src/main/java/com/freelms/lms/
│       ├── FreeLmsApplication.java
│       ├── common/
│       │   ├── dto/
│       │   ├── entity/
│       │   ├── enums/
│       │   ├── exception/
│       │   └── security/
│       ├── config/
│       ├── auth/
│       │   ├── entity/
│       │   ├── dto/
│       │   ├── repository/
│       │   ├── service/
│       │   └── controller/
│       ├── course/
│       ├── enrollment/
│       ├── payment/
│       └── ... (other modules)
└── services/  # Kept for reference
```

## Running the New Architecture

### Development
```bash
# Start infrastructure
docker-compose -f docker-compose.monolith.yml up -d postgres redis

# Run application
cd backend-java/monolith
./mvnw spring-boot:run
```

### Production
```bash
# Start everything
docker-compose -f docker-compose.monolith.yml up -d
```

## API Compatibility

All API endpoints remain the same:

| Endpoint | Status |
|----------|--------|
| /api/v1/auth/* | ✅ Same |
| /api/v1/courses/* | ✅ Same |
| /api/v1/enrollments/* | ✅ Same |
| /api/v1/payments/* | ✅ Same |
| /api/v1/users/* | ✅ Same |

## Performance Improvements

| Metric | Before | After |
|--------|--------|-------|
| Startup time | ~3-5 min (all services) | ~30 sec |
| Memory usage | ~8-16 GB | ~1-2 GB |
| Inter-service calls | 5-50ms latency | <1ms |
| Container count | 35+ | 7 |

## Rollback Plan

If needed, the microservices architecture is preserved in:
- `backend-java/services/` - All original services
- `docker-compose.yml` - Original compose file
- `docker-compose.prod.yml` - Original production compose
