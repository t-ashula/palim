# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build

WORKDIR /workspace

COPY package.json package-lock.json .npmrc ./
COPY packages/core/package.json packages/core/package.json
COPY packages/palim/package.json packages/palim/package.json
COPY vendor/engine262 vendor/engine262
RUN npm ci

COPY tsconfig.json ./
COPY packages/core/tsconfig.build.json packages/core/tsconfig.build.json
COPY packages/palim/tsconfig.build.json packages/palim/tsconfig.build.json
COPY packages/core/src packages/core/src
COPY packages/palim/src packages/palim/src
COPY tools/conformance/report.ts tools/conformance/report.ts
COPY tools/conformance/wpt-progress.ts tools/conformance/wpt-progress.ts
COPY tools/conformance/wpt-report.ts tools/conformance/wpt-report.ts

RUN npm run build \
  && ./node_modules/.bin/esbuild \
    tools/conformance/wpt-report.ts \
    --bundle \
    --format=esm \
    --platform=node \
    --outfile=/workspace/wpt-report.mjs

FROM build AS wpt-node-modules

RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS wpt

RUN apt-get update \
  && apt-get install --yes --no-install-recommends \
    ca-certificates \
    python3-venv \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY --from=wpt-node-modules /workspace/packages/core/package.json packages/core/package.json
COPY --from=wpt-node-modules /workspace/packages/core/dist packages/core/dist
COPY --from=wpt-node-modules /workspace/packages/palim/package.json packages/palim/package.json
COPY --from=wpt-node-modules /workspace/packages/palim/dist packages/palim/dist
COPY --from=wpt-node-modules /workspace/node_modules node_modules
COPY --from=build /workspace/wpt-report.mjs tools/conformance/wpt-report.mjs
COPY tools/wpt/container-entrypoint.sh tools/wpt/container-entrypoint.sh
COPY tools/wpt/include.txt tools/wpt/include.txt
COPY tools/wpt/exclude.txt tools/wpt/exclude.txt
COPY tools/wpt/node-runner.mjs tools/wpt/node-runner.mjs
COPY tools/wpt/product tools/wpt/product

ENTRYPOINT ["sh", "/workspace/tools/wpt/container-entrypoint.sh"]
