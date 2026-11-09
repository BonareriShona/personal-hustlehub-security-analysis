# syntax=docker/dockerfile:1

# The React application is compiled in a Node stage and the resulting static
# files are served by nginx. The runtime image therefore contains no Node
# runtime, no source code and no development dependencies.
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache openssl curl

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

# Scripts placed here are executed by the nginx image before nginx starts.
COPY docker-entrypoint.sh /docker-entrypoint.d/40-generate-certificate.sh

RUN chmod +x /docker-entrypoint.d/40-generate-certificate.sh

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsk https://localhost:5173/ || exit 1