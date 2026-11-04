#!/bin/sh

set -eu

wpt_root=/workspace/conformance/wpt/wpt
wpt_venv="$wpt_root/_venv3"
cd "$wpt_root"

make_manifest_readable() {
  if [ -f "$wpt_root/MANIFEST.json" ]; then
    chmod a+r "$wpt_root/MANIFEST.json"
  fi
}

make_manifest_readable
trap make_manifest_readable EXIT

prepare_environment() {
  if [ ! -x "$wpt_venv/bin/python" ]; then
    python3 -m venv "$wpt_venv"
  fi
  "$wpt_venv/bin/pip" install \
    --disable-pip-version-check \
    --no-deps \
    /workspace/tools/wpt/product
  "$wpt_venv/bin/python" ./wpt \
    --venv "$wpt_venv" \
    run \
    --help > /dev/null
}

if [ "${1:-}" = --prepare ]; then
  prepare_environment
  exit 0
fi
if [ "${PALIM_WPT_ENVIRONMENT_PREPARED:-}" != 1 ]; then
  prepare_environment
fi
export PATH="$wpt_venv/bin:$PATH"
./wpt make-hosts-file >> /etc/hosts
export PALIM_WPT_NODE_RUNNER=/workspace/tools/wpt/node-runner.mjs
wpt_report="$PALIM_CONFORMANCE_RAW_DIRECTORY/wptreport.json"
case "${1:-}" in
  --default)
    shift
    set -- \
      --include-file /workspace/tools/wpt/include.txt \
      --exclude-file /workspace/tools/wpt/exclude.txt \
      palim \
      "$@"
    ;;
  --full)
    shift
    set -- palim "$@"
    ;;
  *)
    set -- palim "$@"
    ;;
esac
set +e
"$wpt_venv/bin/python" ./wpt \
  --venv "$wpt_venv" \
  --skip-venv-setup \
  run \
  --yes \
  --no-manifest-update \
  --no-pause-after-test \
  --timeout-multiplier 5 \
  --test-type testharness \
  --log-wptreport "$wpt_report" \
  "$@"
status=$?
set -e
node /workspace/tools/conformance/wpt-report.mjs \
  "$wpt_report" \
  "$status"
exit "$status"
