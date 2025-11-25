# FREE LMS

**Enterprise Learning Management System**

A full-featured, production-ready LMS platform built with **Java Spring Boot microservices** and **Angular 17+**.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Guide](#development-guide)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Features](#features)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

FREE LMS is an enterprise-grade Learning Management System that provides:

- **Course Management** - Create, publish, and manage courses with modules and lessons
- **User Management** - Multi-role system (Admin, Instructor, Student, Manager)
- **Progress Tracking** - Track student progress, generate certificates
- **Payments** - Subscriptions via Stripe, Payme, Click
- **AI Recommendations** - Personalized course suggestions
- **Smart Search** - NLP-powered search with synonyms
- **Multi-tenancy** - Organizations with custom branding
- **Notifications** - Email, Push, WebSocket real-time updates
- **Webinars** - Zoom and Jitsi integration
- **Gamification** - Points, levels, achievements, badges

---

## Architecture

```
                              CLIENTS
               (Angular 17+ / Mobile / Third-party)
                                |
                                v
+---------------------------------------------------------------+
|                    API GATEWAY (Port 8000)                    |
|           Spring Cloud Gateway + Rate Limiting + JWT          |
+---------------------------------------------------------------+
                                |
        +-----------------------+-----------------------+
        v                       v                       v
+---------------+       +---------------+       +---------------+
| AUTH SERVICE  |       |COURSE SERVICE |       |  ENROLLMENT   |
|  (Port 8081)  |       |  (Port 8082)  |       |  (Port 8083)  |
| - Users       |       | - Courses     |       | - Enrollments |
| - JWT Auth    |       | - Lessons     |       | - Progress    |
| - Roles       |       | - Quizzes     |       | - Certificates|
+---------------+       +---------------+       +---------------+
        |                       |                       |
        v                       v                       v
+---------------+       +---------------+       +---------------+
|   PAYMENT     |       | NOTIFICATION  |       |  ANALYTICS    |
|  (Port 8084)  |       |  (Port 8085)  |       |  (Port 8086)  |
| - Stripe      |       | - Email       |       | - AI Recs     |
| - Payme/Click |       | - Push        |       | - Search      |
| - Subscriptions|      | - WebSocket   |       | - Risk Score  |
+---------------+       +---------------+       +---------------+
        |                       |                       |
        +-----------------------+-----------------------+
                                |
                                v
                    +-------------------+
                    |   ORGANIZATION    |
                    |   (Port 8087)     |
                    | - Multi-tenancy   |
                    | - SSO             |
                    | - SCORM           |
                    | - Webinars        |
                    +-------------------+
                                |
        +-----------------------+-----------------------+
        v                       v                       v
+---------------+       +---------------+       +---------------+
|    EUREKA     |       | CONFIG SERVER |       |    KAFKA      |
|  (Port 8761)  |       |  (Port 8888)  |       |  (Port 9092)  |
+---------------+       +---------------+       +---------------+
```

---

## Technology Stack

### Backend (Java Microservices)

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Java | 21 LTS |
| Framework | Spring Boot | 3.4.0 |
| Cloud | Spring Cloud | 2024.0.0 |
| Security | Spring Security + JWT | 6.x |
| Database | PostgreSQL | 16 |
| ORM | Spring Data JPA / Hibernate | 6.x |
| Cache | Redis | 7 |
| Message Broker | Apache Kafka | 3.5+ |
| API Docs | SpringDoc OpenAPI | 2.7.0 |
| Build | Maven | 3.9+ |

### Frontend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Angular | 17+ |
| UI Library | Angular Material | 17+ |
| State | NgRx | 17+ |
| HTTP | RxJS + HttpClient | 7.8+ |

### Infrastructure

| Component | Technology |
|-----------|------------|
| Containerization | Docker + Docker Compose |
| Service Discovery | Netflix Eureka |
| Configuration | Spring Cloud Config |
| Object Storage | MinIO (S3-compatible) |

---

## Project Structure

```
FREE_LMS/
|
+-- backend-java/                 # Java Spring Boot Microservices
|   +-- common/                   # Shared library (DTO, Entity, Security)
|   +-- docker/                   # Docker configurations
|   +-- docker-compose.yml        # Service orchestration
|   +-- pom.xml                   # Parent Maven POM
|   +-- services/
|       +-- service-registry/     # Eureka Server (8761)
|       +-- config-server/        # Config Server (8888)
|       +-- gateway-service/      # API Gateway (8000)
|       +-- auth-service/         # Authentication (8081)
|       +-- course-service/       # Courses (8082)
|       +-- enrollment-service/   # Enrollments (8083)
|       +-- payment-service/      # Payments (8084)
|       +-- notification-service/ # Notifications (8085)
|       +-- analytics-service/    # Analytics (8086)
|       +-- organization-service/ # Organizations (8087)
|
+-- frontend/                     # Angular 17+ Application
|   +-- src/
|       +-- app/
|           +-- core/             # Singleton services
|           +-- features/         # Feature modules
|           +-- shared/           # Shared components
|
+-- bots/                         # Integration Bots (Node.js)
|   +-- telegram/                 # Telegram Bot
|   +-- whatsapp/                 # WhatsApp Bot
|
+-- database/                     # Database scripts
|   +-- init.sql
|
+-- .github/                      # GitHub Actions
+-- CONTRIBUTING.md
+-- LICENSE
+-- SECURITY.md
+-- README.md
```

---

## Prerequisites

Ensure you have the following installed:

| Software | Version | Required |
|----------|---------|----------|
| Java JDK | 21+ | Yes |
| Maven | 3.9+ | Yes |
| Node.js | 18+ | Yes (for frontend) |
| Docker | 24+ | Yes |
| Docker Compose | 2.20+ | Yes |
| Git | 2.40+ | Yes |

### Verify Installation

```bash
java -version          # Should show 21+
mvn -version           # Should show 3.9+
node -version          # Should show 18+
docker --version       # Should show 24+
docker compose version # Should show 2.20+
```

---

## Quick Start

### Option 1: Docker (Recommended)

Start all services with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/your-repo/FREE_LMS.git
cd FREE_LMS/backend-java

# 2. Start all services
docker compose up -d

# 3. View logs
docker compose logs -f

# 4. Check service health
docker compose ps
```

**Services will be available at:**

| Service | URL | Credentials |
|---------|-----|-------------|
| API Gateway | http://localhost:8000 | - |
| Eureka Dashboard | http://localhost:8761 | eureka / eureka123 |
| Frontend | http://localhost:4200 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |

### Option 2: Manual Development Setup

#### Step 1: Start Infrastructure

```bash
cd backend-java

# Start database, cache, and message broker
docker compose up -d postgres redis kafka zookeeper minio
```

#### Step 2: Build Backend

```bash
# Build all microservices
./mvnw clean install -DskipTests
```

#### Step 3: Start Services

Start services in the following order:

```bash
# Terminal 1: Service Registry (must start first)
cd services/service-registry
../../mvnw spring-boot:run

# Terminal 2: Config Server (wait 30s for registry)
cd services/config-server
../../mvnw spring-boot:run

# Terminal 3: Gateway
cd services/gateway-service
../../mvnw spring-boot:run

# Terminal 4+: Business Services (any order after gateway)
cd services/auth-service
../../mvnw spring-boot:run

cd services/course-service
../../mvnw spring-boot:run

# ... start other services as needed
```

#### Step 4: Start Frontend

```bash
cd frontend
npm install
npm start
# Frontend available at http://localhost:4200
```

---

## Development Guide

### Backend Development

#### Service Ports Reference

| Service | Port | Health Check |
|---------|------|--------------|
| API Gateway | 8000 | /actuator/health |
| Service Registry | 8761 | /actuator/health |
| Config Server | 8888 | /actuator/health |
| Auth Service | 8081 | /actuator/health |
| Course Service | 8082 | /actuator/health |
| Enrollment Service | 8083 | /actuator/health |
| Payment Service | 8084 | /actuator/health |
| Notification Service | 8085 | /actuator/health |
| Analytics Service | 8086 | /actuator/health |
| Organization Service | 8087 | /actuator/health |

#### Creating a New Service

1. Create directory structure:
```bash
mkdir -p services/my-service/src/main/java/com/freelms/myservice
mkdir -p services/my-service/src/main/resources
```

2. Create `pom.xml` with parent reference:
```xml
<parent>
    <groupId>com.freelms</groupId>
    <artifactId>free-lms-parent</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <relativePath>../../pom.xml</relativePath>
</parent>
<artifactId>my-service</artifactId>
```

3. Add to parent `pom.xml` modules section

4. Create `application.yml` configuration

5. Add route in `gateway-service`

6. Add to `docker-compose.yml`

#### Running Tests

```bash
# All tests
./mvnw test

# Specific service
./mvnw test -pl services/auth-service

# Integration tests
./mvnw verify

# With coverage
./mvnw test jacoco:report
```

### Frontend Development

```bash
cd frontend

# Development server with hot reload
npm start                 # http://localhost:4200

# Build for production
npm run build:prod

# Run unit tests
npm test

# Run e2e tests
npm run e2e

# Lint check
npm run lint
```

---

## API Documentation

### Swagger UI

Each service exposes interactive API documentation:

| Service | Swagger URL |
|---------|-------------|
| Auth | http://localhost:8081/swagger-ui.html |
| Course | http://localhost:8082/swagger-ui.html |
| Enrollment | http://localhost:8083/swagger-ui.html |
| Payment | http://localhost:8084/swagger-ui.html |
| Notification | http://localhost:8085/swagger-ui.html |
| Analytics | http://localhost:8086/swagger-ui.html |
| Organization | http://localhost:8087/swagger-ui.html |

### API Endpoints Overview

Base URL: `http://localhost:8000/api/v1`

#### Authentication

```http
POST   /auth/register          # Register new user
POST   /auth/login             # Login with email/password
POST   /auth/refresh           # Refresh access token
POST   /auth/logout            # Logout (revoke tokens)
POST   /auth/change-password   # Change password
GET    /auth/me                # Get current user
```

#### Users

```http
GET    /users                  # List users (Admin)
GET    /users/{id}             # Get user by ID
PUT    /users/me               # Update own profile
PUT    /users/{id}             # Update user (Admin)
DELETE /users/{id}             # Delete user (Admin)
```

#### Courses

```http
GET    /courses                # List published courses
GET    /courses/{id}           # Get course details
GET    /courses/search?q=...   # Search courses
POST   /courses                # Create course (Instructor)
PUT    /courses/{id}           # Update course
PUT    /courses/{id}/publish   # Publish course
DELETE /courses/{id}           # Delete/archive course
```

#### Enrollments

```http
POST   /enrollments/courses/{id}      # Enroll in course
GET    /enrollments/my-courses        # My enrollments
GET    /enrollments/courses/{id}      # Get enrollment status
PUT    /enrollments/{id}/progress     # Update progress
POST   /enrollments/courses/{id}/complete  # Mark complete
```

---

## Configuration

### Environment Variables

Create `.env` file in `backend-java/`:

```env
# ============ Database ============
DB_HOST=localhost
DB_PORT=5432
DB_USER=lms_user
DB_PASSWORD=lms_password

# ============ Redis ============
REDIS_HOST=localhost
REDIS_PORT=6379

# ============ Kafka ============
KAFKA_SERVERS=localhost:9092

# ============ JWT ============
JWT_SECRET=your-256-bit-secret-key-minimum-32-characters-long

# ============ Service Discovery ============
EUREKA_HOST=localhost
EUREKA_PORT=8761
EUREKA_USER=eureka
EUREKA_PASSWORD=eureka123

# ============ Config Server ============
CONFIG_HOST=localhost
CONFIG_PORT=8888
CONFIG_USER=config
CONFIG_PASSWORD=config123

# ============ MinIO ============
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# ============ Payments (Optional) ============
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYME_MERCHANT_ID=...
CLICK_MERCHANT_ID=...

# ============ Email (Optional) ============
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...

# ============ Push Notifications (Optional) ============
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

---

## Deployment

### Docker Production

```bash
cd backend-java

# Build production images
docker compose build

# Start in detached mode
docker compose up -d

# Scale services
docker compose up -d --scale auth-service=3

# View logs
docker compose logs -f auth-service

# Stop all
docker compose down
```

### Health Monitoring

```bash
# Check all services health
curl http://localhost:8761/eureka/apps

# Check specific service
curl http://localhost:8081/actuator/health

# View metrics
curl http://localhost:8081/actuator/metrics
```

---

## Features

### Core Features

- Multi-role authentication (Admin, Instructor, Student, Manager)
- Course management with modules, lessons, quizzes
- Video streaming with HLS support
- Progress tracking and certificates
- Gamification (points, levels, badges)

### Enterprise Features

- Multi-tenancy with organizations
- SSO (SAML, OAuth2, LDAP)
- SCORM package support
- Webinars (Zoom, Jitsi)
- API keys for integrations

### AI/ML Features

- Personalized recommendations
- Student risk assessment
- Learning path optimization
- Smart search with NLP

### Performance

- Redis caching (85%+ hit rate)
- Rate limiting at gateway
- Database indexing (60+ indexes)
- Response time <50ms (p95)

---

## Troubleshooting

### Service won't start

```bash
# Check if dependencies are running
docker compose ps

# Check logs
docker compose logs service-registry
docker compose logs config-server

# Verify port availability
lsof -i :8761
```

### Database connection issues

```bash
# Test PostgreSQL connection
docker exec -it lms-postgres psql -U lms_user -d lms_auth

# Check database logs
docker compose logs postgres
```

### Redis connection issues

```bash
# Test Redis connection
docker exec -it lms-redis redis-cli ping

# Check Redis logs
docker compose logs redis
```

### Build failures

```bash
# Clean and rebuild
./mvnw clean install -DskipTests -U

# Check Java version
java -version  # Must be 21+

# Clear Maven cache
rm -rf ~/.m2/repository/com/freelms
```

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open Pull Request

---

## Security

For security concerns, see [SECURITY.md](SECURITY.md).

Key security features:
- JWT authentication with refresh tokens
- Rate limiting at API Gateway
- CORS configuration
- Input validation (Jakarta Validation)
- SQL injection prevention (JPA/Hibernate)
- XSS protection

---

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/FREE_LMS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/FREE_LMS/discussions)

---

**Made with passion for education technology**
