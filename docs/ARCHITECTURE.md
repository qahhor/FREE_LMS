# Free LMS Architecture Documentation

## Overview

Free LMS is an enterprise Learning Management System. The project has evolved from a microservices architecture to a modular monolith for simplified deployment and maintenance.

## Architecture Evolution

### Previous: Microservices Architecture

The original design consisted of 32 microservices:

**Infrastructure Services:**
- Service Registry (Eureka) - Port 8761
- Config Server - Port 8888
- API Gateway - Port 8000

**Core Services:**
- Auth Service - Port 8081
- Course Service - Port 8082
- Enrollment Service - Port 8083
- Payment Service - Port 8084
- Notification Service - Port 8085
- Analytics Service - Port 8086
- Organization Service - Port 8087

**Feature Services:**
- Learning Path Service - Port 8088
- Skills Service - Port 8089
- Gamification Service - Port 8090
- IDP Service - Port 8091
- Feedback Service - Port 8092
- Mentoring Service - Port 8093
- Social Learning Service - Port 8094
- Compliance Service - Port 8095
- Reporting Service - Port 8096
- Integration Service - Port 8097

**Platform Services:**
- Marketplace Service - Port 8098
- Onboarding Service - Port 8099

**Extension Services:**
- Search Service - Port 8100
- Media Processing Service - Port 8101
- Event Service - Port 8102
- Authoring Service - Port 8103
- Proctoring Service - Port 8104
- Assignment Review Service - Port 8105
- Resource Booking Service - Port 8106
- Audit Logging Service - Port 8107
- LTI Service - Port 8108
- Bot Platform Service - Port 8109

### Current: Modular Monolith Architecture

All services have been consolidated into a single application with modular structure:

```
┌─────────────────────────────────────────────────────────────┐
│                    Free LMS Monolith                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌────────────┐ ┌─────────┐        │
│  │  Auth   │ │ Course  │ │ Enrollment │ │ Payment │        │
│  └────┬────┘ └────┬────┘ └─────┬──────┘ └────┬────┘        │
│       │           │            │              │             │
│  ┌────┴───────────┴────────────┴──────────────┴────┐       │
│  │                   Spring Context                 │       │
│  │         (Direct method calls, Transactions)      │       │
│  └──────────────────────────────────────────────────┘       │
│                            │                                 │
│  ┌─────────────────────────┴──────────────────────────┐    │
│  │                   Data Layer                        │    │
│  │  ┌──────────┐ ┌───────┐ ┌───────────────┐          │    │
│  │  │PostgreSQL│ │ Redis │ │ Elasticsearch │          │    │
│  │  └──────────┘ └───────┘ └───────────────┘          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Key Benefits of Monolith Conversion

### 1. Simplified Operations
- Single application deployment
- No service discovery complexity
- Simplified configuration management
- Easier debugging and tracing

### 2. Performance
- No network overhead between modules
- Direct method calls instead of HTTP/gRPC
- Shared database connections
- Local transactions

### 3. Development Experience
- Faster local development
- Easier integration testing
- Simpler debugging
- Single codebase

### 4. Cost Efficiency
- Fewer containers/pods required
- Reduced infrastructure costs
- Less monitoring overhead

## Module Dependencies

```
                    ┌─────────────┐
                    │   Common    │
                    │  (DTOs,     │
                    │  Entities,  │
                    │  Security)  │
                    └──────┬──────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ▼                      ▼                      ▼
┌───────┐            ┌──────────┐           ┌─────────┐
│ Auth  │◄───────────│  Course  │──────────►│ Payment │
└───┬───┘            └────┬─────┘           └────┬────┘
    │                     │                      │
    │                     ▼                      │
    │              ┌────────────┐                │
    └─────────────►│ Enrollment │◄───────────────┘
                   └─────┬──────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Gamification,      │
              │  Analytics,         │
              │  Notifications      │
              └─────────────────────┘
```

## Data Model

### Core Entities

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │   Course    │     │ Enrollment  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ email       │────►│ instructor  │◄────│ user_id     │
│ password    │     │ title       │     │ course_id   │
│ role        │     │ status      │     │ progress    │
│ org_id      │     │ category_id │     │ status      │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Module    │
                   ├─────────────┤
                   │ id          │
                   │ course_id   │
                   │ title       │
                   │ order       │
                   └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Lesson    │
                   ├─────────────┤
                   │ id          │
                   │ module_id   │
                   │ type        │
                   │ content     │
                   └─────────────┘
```

## API Design

### REST Conventions

- **Base URL**: `/api/v1`
- **Authentication**: Bearer JWT tokens
- **Content-Type**: application/json
- **Pagination**: `?page=0&size=20&sort=createdAt,desc`

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00"
}
```

## Security Architecture

```
┌──────────────┐     ┌─────────────────┐     ┌────────────┐
│   Client     │────►│  JWT Filter     │────►│ Controller │
└──────────────┘     └────────┬────────┘     └────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Security       │
                     │  Context        │
                     │  (UserPrincipal)│
                     └─────────────────┘
```

### Authentication Flow

1. User submits credentials to `/api/v1/auth/login`
2. Server validates credentials
3. Server generates JWT access token + refresh token
4. Client includes `Authorization: Bearer <token>` in requests
5. JwtAuthenticationFilter validates token and sets SecurityContext

## Event-Driven Communication

Even as a monolith, Kafka is used for:
- Audit logging
- Analytics events
- External integrations
- Async notifications

```
┌──────────┐     ┌───────────────┐     ┌────────────────┐
│ Service  │────►│ Kafka Topic   │────►│ Event Consumer │
└──────────┘     └───────────────┘     └────────────────┘
```

## Deployment Architecture

### Docker Compose (Development/Small Scale)

```
┌─────────────────────────────────────────────────────────┐
│                 docker-compose.monolith.yml             │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌───────────┐  ┌───────┐  ┌───────────┐  │
│  │   App   │  │ PostgreSQL│  │ Redis │  │ Kafka     │  │
│  │  :8080  │  │   :5432   │  │ :6379 │  │   :9092   │  │
│  └─────────┘  └───────────┘  └───────┘  └───────────┘  │
│  ┌───────────────┐  ┌───────────┐  ┌───────────────┐   │
│  │ Elasticsearch │  │  MongoDB  │  │     MinIO     │   │
│  │    :9200      │  │  :27017   │  │  :9000/:9001  │   │
│  └───────────────┘  └───────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Kubernetes (Production)

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │                   Ingress                        │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│  ┌───────────────────────┼───────────────────────┐     │
│  │              App Deployment (3 replicas)       │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │     │
│  │  │  Pod 1  │ │  Pod 2  │ │  Pod 3  │         │     │
│  │  └─────────┘ └─────────┘ └─────────┘         │     │
│  └───────────────────────────────────────────────┘     │
│                          │                              │
│  ┌───────────────────────┼───────────────────────┐     │
│  │           Database StatefulSets               │     │
│  │  ┌──────────┐ ┌───────┐ ┌─────────────────┐  │     │
│  │  │PostgreSQL│ │ Redis │ │ Elasticsearch   │  │     │
│  │  └──────────┘ └───────┘ └─────────────────┘  │     │
│  └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Monitoring & Observability

### Health Checks

- `/actuator/health` - Overall health
- `/actuator/health/liveness` - Liveness probe
- `/actuator/health/readiness` - Readiness probe

### Metrics

- `/actuator/metrics` - Application metrics
- `/actuator/prometheus` - Prometheus format

### Logging

- Structured JSON logging in production
- Log levels configurable via environment
- Request/response logging available
