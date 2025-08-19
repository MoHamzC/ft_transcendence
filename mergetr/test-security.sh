#!/bin/bash
# test-security.sh - Tests automatisés de sécurité

set -euo pipefail

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:3001"
API_URL="$BASE_URL/api"

echo -e "${BLUE}🔒 Tests de Sécurité ft_transcendence${NC}"
echo -e "${BLUE}=====================================${NC}"

# Fonction de test
test_security() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    echo -n "Testing $test_name... "
    
    if output=$(eval "$command" 2>&1); then
        if echo "$output" | grep -q "$expected_pattern"; then
            echo -e "${GREEN}✅ PASS${NC}"
            return 0
        else
            echo -e "${RED}❌ FAIL (unexpected response)${NC}"
            echo "Expected: $expected_pattern"
            echo "Got: $output"
            return 1
        fi
    else
        echo -e "${RED}❌ FAIL (command failed)${NC}"
        echo "Command: $command"
        echo "Output: $output"
        return 1
    fi
}

# Attendre que les services soient prêts
echo "⏳ Waiting for services to be ready..."
for i in {1..30}; do
    if curl -s "$BASE_URL/healthz" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Services are ready${NC}"
        break
    fi
    sleep 2
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Services not ready after 60 seconds${NC}"
        exit 1
    fi
done

echo
echo -e "${YELLOW}🛡️  Testing Security Headers${NC}"

# Test 1: Security Headers
test_security "Security headers" \
    "curl -s -I $BASE_URL/healthz | grep -i 'x-frame-options\\|x-content-type-options\\|x-xss-protection'" \
    "X-"

echo
echo -e "${YELLOW}🔐 Testing Authentication Security${NC}"

# Test 4: Rate Limiting on Login
test_security "Rate limiting on login" \
    "for i in {1..15}; do curl -k -s -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\",\"password\":\"wrong\"}'; done | tail -1" \
    "Rate limit exceeded"

# Test 5: Invalid email format
test_security "Invalid email rejection" \
    "curl -k -s -X POST $API_URL/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"invalid-email\",\"username\":\"test\",\"password\":\"Test123!@#Test\"}'" \
    "Invalid email"

# Test 6: Weak password rejection
test_security "Weak password rejection" \
    "curl -k -s -X POST $API_URL/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"username\":\"test\",\"password\":\"weak\"}'" \
    "Password must"

echo
echo -e "${YELLOW}⚔️  Testing XSS Protection${NC}"

# Test 7: XSS in registration
test_security "XSS protection in username" \
    "curl -k -s -X POST $API_URL/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"username\":\"<script>alert(1)</script>\",\"password\":\"Test123!@#Test\"}'" \
    "error"

echo
echo -e "${YELLOW}🗃️  Testing SQL Injection Protection${NC}"

# Test 8: SQL Injection in login
test_security "SQL injection protection" \
    "curl -k -s -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@test.com'; DROP TABLE users; --\",\"password\":\"any\"}'" \
    "Invalid"

echo
echo -e "${YELLOW}🔒 Testing JWT Security${NC}"

# Test 9: Protected route without token
test_security "Protected route without token" \
    "curl -k -s -o /dev/null -w '%{http_code}' $API_URL/auth/protected" \
    "401"

# Test 10: Protected route with invalid token
test_security "Protected route with invalid token" \
    "curl -k -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer invalid_token' $API_URL/auth/protected" \
    "401"

echo
echo -e "${YELLOW}🗂️  Testing Vault Security${NC}"

# Test 11: Vault routes protection in production
if [ "${NODE_ENV:-}" = "production" ]; then
    test_security "Vault routes blocked in production" \
        "curl -k -s -o /dev/null -w '%{http_code}' $API_URL/vault/secrets" \
        "403"
fi

# Test 12: Health check accessibility
test_security "Health check accessible" \
    "curl -s $BASE_URL/healthz" \
    "ok"

echo
echo -e "${YELLOW}📊 Testing Input Validation${NC}"

# Test 13: Oversized input rejection
test_security "Oversized input rejection" \
    "curl -k -s -X POST $API_URL/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"username\":\"$(printf 'a%.0s' {1..1000})\",\"password\":\"Test123!@#Test\"}'" \
    "error"

# Test 14: Invalid JSON handling
test_security "Invalid JSON handling" \
    "curl -k -s -X POST $API_URL/auth/register -H 'Content-Type: application/json' -d 'invalid json'" \
    "error"

echo
echo -e "${YELLOW}🌐 Testing CORS Configuration${NC}"

# Test 15: CORS headers
test_security "CORS headers present" \
    "curl -s -H 'Origin: http://localhost:3000' -I $API_URL/auth/status | grep -i access-control" \
    "Access-Control"

echo
echo -e "${GREEN}🎉 Security Tests Completed!${NC}"

# Summary
passed=$(grep -c "✅ PASS" /tmp/security_test_output 2>/dev/null || echo "0")
failed=$(grep -c "❌ FAIL" /tmp/security_test_output 2>/dev/null || echo "0")
total=$((passed + failed))

if [ $total -gt 0 ]; then
    echo
    echo -e "${BLUE}📊 Test Summary:${NC}"
    echo -e "  Total tests: $total"
    echo -e "  Passed: ${GREEN}$passed${NC}"
    echo -e "  Failed: ${RED}$failed${NC}"
    
    if [ $failed -eq 0 ]; then
        echo
        echo -e "${GREEN}🏆 ALL SECURITY TESTS PASSED!${NC}"
        echo -e "${GREEN}🔒 Security Score: 100/100${NC}"
        exit 0
    else
        echo
        echo -e "${RED}⚠️  Some security tests failed. Please review and fix.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  No test results found${NC}"
    exit 1
fi
