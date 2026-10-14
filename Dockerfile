# syntax=docker/dockerfile:1.7
FROM node:24-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
COPY . .
# Build-time placeholders only; real values come from the runtime environment.
ENV PAYLOAD_SECRET=build-only-placeholder-secret-0123456789 DATABASE_URL=file:/tmp/build.db DATA_DIR=/tmp/hc-data SITE_URL=https://hadramout.center
RUN npm run build

# One-off tooling image: migrations, seeding, importers (needs the full source + dev dependencies).
FROM deps AS tools
COPY . .
ENV NODE_ENV=production
CMD ["npm", "run", "payload", "--", "migrate"]

FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/data/payload.db DATA_DIR=/data MEDIA_DIR=/data/media
RUN mkdir -p /data && chown -R node:node /data /app
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/messages ./messages
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/hc/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
