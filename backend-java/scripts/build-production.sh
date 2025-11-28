#!/bin/bash

# FREE LMS - Production Build Script
# Builds all microservices as JAR files for production deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/build-output"

echo "================================================="
echo "  FREE LMS - Production Build"
echo "  Building 32 microservices"
echo "================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUTPUT_DIR"

cd "$PROJECT_ROOT"

echo -e "${YELLOW}Step 1: Clean previous builds...${NC}"
mvn clean -q

echo -e "${YELLOW}Step 2: Building all modules (this may take 10-15 minutes)...${NC}"
mvn package -DskipTests -B -q

echo ""
echo -e "${GREEN}Build completed!${NC}"
echo ""

# Collect JARs
echo -e "${YELLOW}Step 3: Collecting JAR files...${NC}"

# Infrastructure services
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

for SERVICE_INFO in "${SERVICES[@]}"; do
    IFS=':' read -r SERVICE_PATH SERVICE_NAME <<< "$SERVICE_INFO"
    JAR_PATH="$PROJECT_ROOT/$SERVICE_PATH/target"

    if [ -d "$JAR_PATH" ]; then
        JAR_FILE=$(find "$JAR_PATH" -name "*.jar" -not -name "*-sources.jar" -not -name "*-javadoc.jar" 2>/dev/null | head -1)
        if [ -n "$JAR_FILE" ]; then
            cp "$JAR_FILE" "$OUTPUT_DIR/${SERVICE_NAME}.jar"
            echo -e "  ${GREEN}✓${NC} $SERVICE_NAME.jar"
        else
            echo -e "  ${RED}✗${NC} $SERVICE_NAME (JAR not found)"
        fi
    else
        echo -e "  ${RED}✗${NC} $SERVICE_NAME (target directory not found)"
    fi
done

echo ""
echo "================================================="
echo -e "${GREEN}Production JARs collected in: $OUTPUT_DIR${NC}"
echo ""

# List all JARs with sizes
echo "Built artifacts:"
echo "-------------------------------------------------"
ls -lh "$OUTPUT_DIR"/*.jar 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo "-------------------------------------------------"
echo ""

# Calculate total size
TOTAL_SIZE=$(du -sh "$OUTPUT_DIR" | cut -f1)
echo "Total size: $TOTAL_SIZE"
echo ""

echo "To run a service:"
echo "  java -jar $OUTPUT_DIR/<service-name>.jar"
echo ""
echo "To run with production profile:"
echo "  java -jar -Dspring.profiles.active=prod $OUTPUT_DIR/<service-name>.jar"
echo ""
