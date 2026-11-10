
# syntax=docker/dockerfile:1

# Build the React application in a separate Node stage.
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

# Prevent dependency lifecycle scripts during installation.
RUN npm ci --ignore-scripts

COPY . .

# Explicitly build the production frontend.
RUN npm run build


# Serve the static frontend with non-root Nginx.
FROM nginxinc/nginx-unprivileged:1.31-alpine AS runtime

# Temporarily use root to install required utilities.
USER root

RUN apk add --no-cache openssl curl

# Copy Nginx configuration.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the compiled frontend.
COPY --from=build /app/dist /usr/share/nginx/html

# Generate self-signed HTTPS certificates at startup.
COPY docker-entrypoint.sh /docker-entrypoint.d/40-generate-certificate.sh

RUN chmod 755 /docker-entrypoint.d/40-generate-certificate.sh

# Nginx and startup scripts run without root privileges.
USER 101:101

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsk https://localhost:5173/ || exit 1
