#!/bin/sh

set -eu

command=${1:-}
if [ -z "$command" ]; then
  echo "usage: container-entrypoint.sh {wpt|conformance} [arguments...]" >&2
  exit 2
fi
shift

case "$command" in
  wpt)
    cd /workspace/conformance/wpt/wpt
    export PATH="/opt/wpt-venv/bin:$PATH"
    cat /opt/wpt-hosts >> /etc/hosts
    export PALIM_WPT_NODE_RUNNER=/workspace/tools/wpt/node-runner.mjs
    wpt_report="$PALIM_CONFORMANCE_RAW_DIRECTORY/wptreport.json"
    set +e
    ./wpt \
      --venv /opt/wpt-venv \
      --skip-venv-setup \
      run \
      --yes \
      --no-pause-after-test \
      --log-wptreport "$wpt_report" \
      --exclude-file /workspace/tools/wpt/exclude.txt \
      palim \
      "$@"
    status=$?
    set -e
    node --import tsx \
      /workspace/tools/conformance/wpt-report.ts \
      "$wpt_report" \
      "$status"
    exit "$status"
    ;;
  conformance)
    exec sh /workspace/tools/conformance/run-in-container.sh "$@"
    ;;
  *)
    echo "unknown container command: $command" >&2
    exit 2
    ;;
esac
