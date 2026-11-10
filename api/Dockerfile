# syntax=docker/dockerfile:1

# Dependencies are installed in a separate stage so that the runtime image
# contains only production packages and none of the build tooling.
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --ignore-scripts


FROM node:24-alpine AS runtime

# openssl generates the development certificate at container start.
# curl is used by the container healthcheck.
RUN apk add --no-cache openssl curl

ENV NODE_ENV=production

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# Only application source is copied. Tests, Postman collections and local
# environment files stay out of the image.
COPY package.json ./
COPY index.js ./
COPY config ./config
COPY controllers ./controllers
COPY middleware ./middleware
COPY models ./models
COPY routes ./routes
COPY services ./services
COPY utils ./utils

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /app/certs \
    && chown -R node:node /app

# The container runs as an unprivileged user. A compromise inside the
# application does not then carry root privileges within the container.
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsk https://localhost:4000/health \
     || curl -fs http://localhost:4000/health \
     || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["node", "index.js"]