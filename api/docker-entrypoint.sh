#!/bin/sh
set -e

# The API reads its certificate from disk at startup. A container has no
# certificate of its own, so a self-signed development certificate is
# generated on first run if one has not been mounted in.
#
# This is a development and demonstration convenience. A production
# deployment would mount a certificate issued by a certificate authority,
# or terminate TLS at a load balancer ahead of the container.

CERT_DIR="${CERT_DIR:-/app/certs}"
KEY_PATH="${SSL_KEY_PATH:-$CERT_DIR/localhost-key.pem}"
CERT_PATH="${SSL_CERT_PATH:-$CERT_DIR/localhost-cert.pem}"

if [ "$USE_HTTPS" = "true" ]; then
    if [ ! -f "$KEY_PATH" ] || [ ! -f "$CERT_PATH" ]; then
        echo "No certificate found. Generating a self-signed development certificate."
        mkdir -p "$CERT_DIR"
        openssl req -x509 -newkey rsa:2048 -nodes \
            -keyout "$KEY_PATH" \
            -out "$CERT_PATH" \
            -days 365 \
            -subj "/CN=localhost" >/dev/null 2>&1
    fi
fi

exec "$@"