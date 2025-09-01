#!/bin/bash

echo "🔍 Testing Production Endpoints"
echo "==============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test main application
echo "Testing main application..."
response=$(curl -k -s -w "%{http_code}" https://localhost:8443/ 2>/dev/null)
if [[ "$response" == *"200"* ]]; then
    echo -e "${GREEN}✅ Main application: OK (200)${NC}"
else
    echo -e "${RED}❌ Main application: FAILED${NC}"
fi

# Test Vault health
echo "Testing Vault health..."
response=$(curl -k -s -w "%{http_code}" https://localhost:8443/api/vault/health 2>/dev/null)
if [[ "$response" == *"200"* ]]; then
    echo -e "${GREEN}✅ Vault health: OK (200)${NC}"
elif [[ "$response" == *"503"* ]]; then
    echo -e "${YELLOW}⚠️  Vault health: SERVICE UNAVAILABLE (503)${NC}"
else
    echo -e "${RED}❌ Vault health: FAILED${NC}"
fi

# Test GDPR endpoint
echo "Testing GDPR endpoint..."
response=$(curl -k -s -w "%{http_code}" https://localhost:8443/api/gdpr/test 2>/dev/null)
if [[ "$response" == *"200"* ]]; then
    echo -e "${GREEN}✅ GDPR test: OK (200)${NC}"
else
    echo -e "${RED}❌ GDPR test: FAILED${NC}"
fi

# Test backend health
echo "Testing backend health..."
response=$(curl -k -s -w "%{http_code}" https://localhost:8443/healthz 2>/dev/null)
if [[ "$response" == *"200"* ]]; then
    echo -e "${GREEN}✅ Backend health: OK (200)${NC}"
else
    echo -e "${RED}❌ Backend health: FAILED${NC}"
fi

echo "==============================="
echo "Test completed!"
