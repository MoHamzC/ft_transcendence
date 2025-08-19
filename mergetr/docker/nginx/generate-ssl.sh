#!/bin/bash
# Generate SSL certificates for development

mkdir -p ./ssl

echo "🔐 Generating SSL certificate for localhost..."

# Generate private key
openssl genrsa -out ./ssl/key.pem 2048

# Generate certificate
openssl req -new -x509 -key ./ssl/key.pem -out ./ssl/cert.pem -days 365 \
    -subj "/C=FR/ST=France/L=Paris/O=42School/OU=ft_transcendence/CN=localhost"

echo "✅ SSL certificates generated:"
echo "  - Private key: ./ssl/key.pem"
echo "  - Certificate: ./ssl/cert.pem"
echo "  - Valid for: 365 days"
echo ""
echo "⚠️  These are self-signed certificates for development only"
