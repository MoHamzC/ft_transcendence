#!/bin/bash

echo "🔍 Testing Production Setup - Vault & GDPR"
echo "=========================================="

# Test main application
echo "Testing main application..."
curl -k -s https://localhost:8443/ > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Main application: RESPONDING"
else
    echo "❌ Main application: NOT RESPONDING"
fi

# Test Vault health
echo "Testing Vault health..."
curl -k -s https://localhost:8443/api/vault/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Vault health: RESPONDING"
else
    echo "❌ Vault health: NOT RESPONDING"
fi

# Test GDPR endpoint
echo "Testing GDPR endpoint..."
curl -k -s https://localhost:8443/api/gdpr/test > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ GDPR test: RESPONDING"
else
    echo "❌ GDPR test: NOT RESPONDING"
fi

# Test backend health
echo "Testing backend health..."
curl -k -s https://localhost:8443/healthz > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend health: RESPONDING"
else
    echo "❌ Backend health: NOT RESPONDING"
fi

echo "=========================================="
echo "Test completed!"
