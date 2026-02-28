FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/db/package.json packages/db/package.json

RUN pnpm install --frozen-lockfile

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 8080

# Run API directly from TypeScript using tsx runtime (workspace-aware).
CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
