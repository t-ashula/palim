FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install --yes --no-install-recommends \
    ca-certificates \
    curl \
    git \
    jq \
    perl \
    python3 \
    python3-venv \
  && rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/python3 /usr/local/bin/python

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY conformance/conformance.json conformance/conformance.json
COPY tools/conformance tools/conformance
COPY tools/url tools/url
COPY src/html src/html
COPY src/url src/url

ENV PALIM_REPOSITORY_ROOT=/workspace
RUN npm run conformance:sync \
  && cd conformance/wpt/wpt \
  && ./wpt make-hosts-file > /opt/wpt-hosts

COPY . .

RUN npm run build \
  && python3 -m venv /opt/wpt-venv \
  && /opt/wpt-venv/bin/pip install \
    --disable-pip-version-check \
    -r conformance/wpt/wpt/tools/manifest/requirements.txt \
    -r conformance/wpt/wpt/tools/wptrunner/requirements.txt \
    -r conformance/wpt/wpt/tools/serve/requirements.txt \
  && /opt/wpt-venv/bin/pip install \
    --disable-pip-version-check \
    --no-deps \
    tools/wpt/product

ENTRYPOINT ["sh", "/workspace/tools/wpt/container-entrypoint.sh"]
