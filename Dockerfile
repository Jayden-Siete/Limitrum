FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS deps

# Copy full workspace so pnpm symlink layout stays valid.
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @limitrum/db build && pnpm --filter @limitrum/sdk build && pnpm --filter @limitrum/api build

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=deps /app /app

EXPOSE 8080

# Run compiled API (no tsx/dev-runtime dependency on Cloud Run).
CMD ["node", "/app/apps/api/dist/index.js"]
