#!/bin/sh
set -e

# nginx serves the frontend over HTTPS to match the development server and
# the API. A self-signed certificate is generated on first run.

CERT_DIR=/etc/nginx/certs

if [ ! -f "$CERT_DIR/localhost-cert.pem" ] || [ ! -f "$CERT_DIR/localhost-key.pem" ]; then
    echo "No certificate found. Generating a self-signed development certificate."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -newkey rsa:2048 -nodes \
        -keyout "$CERT_DIR/localhost-key.pem" \
        -out "$CERT_DIR/localhost-cert.pem" \
        -days 365 \
        -subj "/CN=localhost" >/dev/null 2>&1
fi