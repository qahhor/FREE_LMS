# Free LMS - Monolithic Application

Enterprise Learning Management System built as a modular monolith.

## Overview

This is a consolidated monolithic version of the Free LMS platform, combining all 32 microservices into a single deployable unit while maintaining modular internal structure for maintainability.

## Architecture

### From Microservices to Monolith

The project was converted from a microservices architecture to a modular monolith for the following benefits:

- **Simplified Deployment**: Single application to deploy and manage
- **Reduced Complexity**: No service discovery, config server, or API gateway needed
- **Lower Operational Overhead**: Fewer containers, simpler monitoring
- **Easier Development**: Direct method calls instead of HTTP/Kafka communication
- **Better Performance**: No network latency between modules

### Module Structure

```
src/main/java/com/freelms/lms/
├── common/                 # Shared utilities, DTOs, exceptions
│   ├── dto/               # API response wrappers
│   ├── entity/            # Base entities
│   ├── enums/             # All enumerations
│   ├── exception/         # Custom exceptions
│   └── security/          # JWT, authentication
├── config/                # Application configurations
├── auth/                  # Authentication & users
├── course/                # Course management
├── enrollment/            # Enrollments & progress
├── payment/               # Payment processing
├── notification/          # Notifications
├── gamification/          # Points, badges, leaderboards
├── analytics/             # Analytics & reporting
├── organization/          # Multi-tenancy
├── search/                # Search functionality
├── media/                 # Media processing
└── ...                    # Other modules
```

## Technology Stack

- **Java 21** - Latest LTS version
- **Spring Boot 3.2.5** - Application framework
- **Spring Security** - Authentication & Authorization
- **Spring Data JPA** - Database access
- **PostgreSQL 16** - Primary database
- **Redis 7** - Caching & sessions
- **Kafka** - Event streaming (optional)
- **Elasticsearch 8** - Full-text search
- **MongoDB 7** - Document storage
- **MinIO** - S3-compatible object storage

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.9+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/FREE-LMS.git
cd FREE-LMS/backend-java/monolith
```

2. **Start infrastructure services**
```bash
cd ../..
docker-compose -f docker-compose.monolith.yml up -d postgres redis
```

3. **Run the application**
```bash
cd backend-java/monolith
./mvnw spring-boot:run
```

4. **Access the application**
- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- Actuator: http://localhost:8080/actuator

### Production Deployment

1. **Build the Docker image**
```bash
cd backend-java/monolith
docker build -t freelms:latest .
```

2. **Start all services**
```bash
docker-compose -f docker-compose.monolith.yml up -d
```

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh | Refresh token |
| POST | /api/v1/auth/logout | Logout |
| GET | /api/v1/auth/me | Current user |

### Courses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/courses | List courses |
| GET | /api/v1/courses/{id} | Get course |
| POST | /api/v1/courses | Create course |
| PUT | /api/v1/courses/{id} | Update course |
| DELETE | /api/v1/courses/{id} | Delete course |
| POST | /api/v1/courses/{id}/publish | Publish course |

### Enrollments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/enrollments | Enroll in course |
| GET | /api/v1/enrollments/my | My enrollments |
| PUT | /api/v1/enrollments/{id}/progress | Update progress |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| SERVER_PORT | Application port | 8080 |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | freelms |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | postgres |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| JWT_SECRET | JWT signing key | - |
| KAFKA_SERVERS | Kafka bootstrap servers | localhost:9092 |

### Profiles

- `dev` - Development (SQL logging, create-drop)
- `prod` - Production (validate, optimized settings)
- `test` - Testing (H2 in-memory database)

## Testing

```bash
# Run all tests
./mvnw test

# Run with coverage
./mvnw test jacoco:report
```

## Security

- JWT-based authentication
- Password hashing with BCrypt (12 rounds)
- Rate limiting
- CORS configuration
- Input validation

## Monitoring

- Health check: `/actuator/health`
- Metrics: `/actuator/metrics`
- Prometheus: `/actuator/prometheus`

## Default Users

| Email | Password | Role |
|-------|----------|------|
| admin@freelms.com | Admin123! | ADMIN |

## License

MIT License
