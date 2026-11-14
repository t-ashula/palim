# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build

WORKDIR /workspace

COPY package.json package-lock.json .npmrc ./
COPY packages/polyfills/package.json packages/polyfills/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/window/package.json packages/window/package.json
COPY packages/scripting/package.json packages/scripting/package.json
COPY packages/engine262/package.json packages/engine262/package.json
COPY packages/worker/package.json packages/worker/package.json
COPY packages/palim/package.json packages/palim/package.json
COPY vendor/engine262 vendor/engine262
RUN npm ci

COPY tsconfig.json ./
COPY packages/polyfills/tsconfig.build.json packages/polyfills/tsconfig.build.json
COPY packages/core/tsconfig.build.json packages/core/tsconfig.build.json
COPY packages/window/tsconfig.build.json packages/window/tsconfig.build.json
COPY packages/scripting/tsconfig.build.json packages/scripting/tsconfig.build.json
COPY packages/engine262/tsconfig.build.json packages/engine262/tsconfig.build.json
COPY packages/worker/tsconfig.build.json packages/worker/tsconfig.build.json
COPY packages/palim/tsconfig.build.json packages/palim/tsconfig.build.json
COPY packages/polyfills/src packages/polyfills/src
COPY packages/core/src packages/core/src
COPY packages/window/src packages/window/src
COPY packages/scripting/src packages/scripting/src
COPY packages/engine262/src packages/engine262/src
COPY packages/worker/src packages/worker/src
COPY packages/palim/src packages/palim/src
COPY tools/conformance/tsconfig.build.json tools/conformance/tsconfig.build.json
COPY tools/conformance/report.ts tools/conformance/report.ts
COPY tools/conformance/wpt-progress.ts tools/conformance/wpt-progress.ts
COPY tools/conformance/wpt-report.ts tools/conformance/wpt-report.ts

RUN npm run build \
  && npm run build:wpt-report

FROM build AS wpt-node-modules

RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS wpt

RUN apt-get update \
  && apt-get install --yes --no-install-recommends \
    ca-certificates \
    python3-venv \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY --from=wpt-node-modules /workspace/package.json package.json
COPY --from=wpt-node-modules /workspace/packages/polyfills/package.json packages/polyfills/package.json
COPY --from=wpt-node-modules /workspace/packages/polyfills/dist packages/polyfills/dist
COPY --from=wpt-node-modules /workspace/packages/core/package.json packages/core/package.json
COPY --from=wpt-node-modules /workspace/packages/core/dist packages/core/dist
COPY --from=wpt-node-modules /workspace/packages/window/package.json packages/window/package.json
COPY --from=wpt-node-modules /workspace/packages/window/dist packages/window/dist
COPY --from=wpt-node-modules /workspace/packages/scripting/package.json packages/scripting/package.json
COPY --from=wpt-node-modules /workspace/packages/scripting/dist packages/scripting/dist
COPY --from=wpt-node-modules /workspace/packages/engine262/package.json packages/engine262/package.json
COPY --from=wpt-node-modules /workspace/packages/engine262/dist packages/engine262/dist
COPY --from=wpt-node-modules /workspace/packages/worker/package.json packages/worker/package.json
COPY --from=wpt-node-modules /workspace/packages/worker/dist packages/worker/dist
COPY --from=wpt-node-modules /workspace/packages/palim/package.json packages/palim/package.json
COPY --from=wpt-node-modules /workspace/packages/palim/dist packages/palim/dist
COPY --from=wpt-node-modules /workspace/node_modules node_modules
COPY --from=build /workspace/tools/conformance/dist tools/conformance/dist
COPY tools/wpt/container-entrypoint.sh tools/wpt/container-entrypoint.sh
COPY tools/wpt/include.txt tools/wpt/include.txt
COPY tools/wpt/exclude.txt tools/wpt/exclude.txt
COPY tools/wpt/node-runner.mjs tools/wpt/node-runner.mjs
COPY tools/wpt/product tools/wpt/product

ENTRYPOINT ["sh", "/workspace/tools/wpt/container-entrypoint.sh"]
