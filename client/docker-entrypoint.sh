
#!/bin/sh
set -e

# Generate a development HTTPS certificate without root privileges.
# Production deployments should use externally managed certificates.

CERT_DIR=/tmp/hustlehub-certs
CERT_FILE="$CERT_DIR/localhost-cert.pem"
KEY_FILE="$CERT_DIR/localhost-key.pem"

mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "Generating a self-signed development certificate."

    openssl req -x509 -newkey rsa:2048 -nodes \
        -keyout "$KEY_FILE" \
        -out "$CERT_FILE" \
        -days 365 \
        -subj "/CN=localhost" >/dev/null 2>&1

    chmod 600 "$KEY_FILE"
    chmod 644 "$CERT_FILE"
fi

echo "Development HTTPS certificate is ready."
