#!/bin/bash

# FREE LMS - Docker Image Build Script
# Builds Docker images for all microservices

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
REGISTRY="${DOCKER_REGISTRY:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
PUSH_IMAGES="${PUSH_IMAGES:-false}"

echo "================================================="
echo "  FREE LMS - Docker Image Build"
echo "  Registry: ${REGISTRY:-local}"
echo "  Tag: $IMAGE_TAG"
echo "================================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Define all services
SERVICES=(
    "infrastructure/service-registry:service-registry"
    "infrastructure/config-server:config-server"
    "infrastructure/gateway-service:gateway-service"
    "services/auth-service:auth-service"
    "services/course-service:course-service"
    "services/enrollment-service:enrollment-service"
    "services/payment-service:payment-service"
    "services/notification-service:notification-service"
    "services/analytics-service:analytics-service"
    "services/organization-service:organization-service"
    "services/learning-path-service:learning-path-service"
    "services/skills-service:skills-service"
    "services/gamification-service:gamification-service"
    "services/idp-service:idp-service"
    "services/feedback-service:feedback-service"
    "services/mentoring-service:mentoring-service"
    "services/social-learning-service:social-learning-service"
    "services/compliance-service:compliance-service"
    "services/reporting-service:reporting-service"
    "services/integration-service:integration-service"
    "services/marketplace-service:marketplace-service"
    "services/onboarding-service:onboarding-service"
    "services/search-service:search-service"
    "services/media-processing-service:media-processing-service"
    "services/event-service:event-service"
    "services/authoring-service:authoring-service"
    "services/proctoring-service:proctoring-service"
    "services/assignment-review-service:assignment-review-service"
    "services/resource-booking-service:resource-booking-service"
    "services/audit-logging-service:audit-logging-service"
    "services/lti-service:lti-service"
    "services/bot-platform-service:bot-platform-service"
)

SUCCESS_COUNT=0
FAIL_COUNT=0

for SERVICE_INFO in "${SERVICES[@]}"; do
    IFS=':' read -r SERVICE_PATH SERVICE_NAME <<< "$SERVICE_INFO"
    SERVICE_DIR="$PROJECT_ROOT/$SERVICE_PATH"

    if [ -f "$SERVICE_DIR/Dockerfile" ]; then
        echo -e "${YELLOW}Building ${SERVICE_NAME}...${NC}"

        if [ -n "$REGISTRY" ]; then
            IMAGE_NAME="$REGISTRY/freelms-${SERVICE_NAME}:${IMAGE_TAG}"
        else
            IMAGE_NAME="freelms-${SERVICE_NAME}:${IMAGE_TAG}"
        fi

        if docker build -t "$IMAGE_NAME" "$SERVICE_DIR" -q; then
            echo -e "  ${GREEN}✓${NC} $IMAGE_NAME"
            ((SUCCESS_COUNT++))

            if [ "$PUSH_IMAGES" = "true" ] && [ -n "$REGISTRY" ]; then
                echo "  Pushing to registry..."
                docker push "$IMAGE_NAME"
            fi
        else
            echo -e "  ${RED}✗${NC} Failed to build $SERVICE_NAME"
            ((FAIL_COUNT++))
        fi
    else
        echo -e "${RED}  ✗ No Dockerfile found for $SERVICE_NAME${NC}"
        ((FAIL_COUNT++))
    fi
done

echo ""
echo "================================================="
echo "Build Summary"
echo "-------------------------------------------------"
echo -e "${GREEN}Successful:${NC} $SUCCESS_COUNT"
echo -e "${RED}Failed:${NC}     $FAIL_COUNT"
echo "================================================="
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
    exit 1
fi

echo "To push images to a registry:"
echo "  DOCKER_REGISTRY=your-registry.com PUSH_IMAGES=true ./build-docker-images.sh"
echo ""
