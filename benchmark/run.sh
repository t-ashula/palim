#!/bin/sh

set -eu

domain=${1:-all}
samples=${PALIM_BENCHMARK_SAMPLES:-10}
warmup_operations=${PALIM_BENCHMARK_WARMUP:-16}
measured_operations=${PALIM_BENCHMARK_OPERATIONS:-64}

case "$domain" in
  all | speed | memory) ;;
  *)
    echo "usage: $0 [all|speed|memory]" >&2
    exit 2
    ;;
esac

for value in "$samples" "$warmup_operations" "$measured_operations"; do
  case "$value" in
    '' | *[!0-9]*)
      echo "benchmark counts must be positive integers" >&2
      exit 2
      ;;
  esac
  if [ "$value" -eq 0 ]; then
    echo "benchmark counts must be positive integers" >&2
    exit 2
  fi
done

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"

revision=$(git rev-parse HEAD)
tree_state=clean
if [ -n "$(git status --porcelain -- src benchmark package.json package-lock.json tsconfig.json)" ]; then
  tree_state=dirty
fi

source_digest=$(
  {
    find src benchmark -type f \( -name '*.ts' -o -name '*.sh' \) -exec sha256sum {} +
    sha256sum package.json package-lock.json tsconfig.json
  } | sort | sha256sum | cut -d ' ' -f 1
)
corpus_digest=$(
  find benchmark/corpus -type f -exec sha256sum {} + | sort | sha256sum | cut -d ' ' -f 1
)

node_version=$(node --version)
platform=$(uname -s)
architecture=$(uname -m)
kernel=$(uname -r)
environment_id=$(
  printf '%s-%s-%s-%s' "$node_version" "$platform" "$architecture" "$kernel" |
    tr '[:upper:]' '[:lower:]'
)
session_id=$(date -u '+%Y-%m-%dT%H-%M-%SZ')-$$

export PALIM_ARCHITECTURE="$architecture"
export PALIM_BENCHMARK_OPERATIONS="$measured_operations"
export PALIM_BENCHMARK_SAMPLES="$samples"
export PALIM_BENCHMARK_WARMUP="$warmup_operations"
export PALIM_CORPUS_DIGEST="$corpus_digest"
export PALIM_ENVIRONMENT_ID="$environment_id"
export PALIM_KERNEL="$kernel"
export PALIM_PLATFORM="$platform"
export PALIM_REVISION="$revision"
export PALIM_SOURCE_DIGEST="$source_digest"
export PALIM_TREE_STATE="$tree_state"

step=0
if [ "$domain" = all ]; then
  total_steps=11
elif [ "$domain" = speed ]; then
  total_steps=3
else
  total_steps=8
fi

progress() {
  step=$((step + 1))
  printf '[%s/%s] %s\n' "$step" "$total_steps" "$1"
}

run_speed_series() {
  speed_mode=$1
  raw_directory="tmp/measurements/speed/$session_id/$speed_mode"
  mkdir -p "$raw_directory"
  : >"$raw_directory/samples.jsonl"
  PALIM_RUN_ID="$session_id-speed-$speed_mode"
  export PALIM_RUN_ID
  node --import tsx benchmark/measure.ts metadata speed "$speed_mode" \
    >"$raw_directory/run.json"

  operations=1
  if [ "$speed_mode" = warm ]; then
    operations=$measured_operations
  fi
  case_names=$(node --import tsx benchmark/measure.ts cases speed)
  sample=1
  while [ "$sample" -le "$samples" ]; do
    for case_name in $case_names; do
      node --import tsx benchmark/measure.ts \
        speed "$speed_mode" "$case_name" "$sample" "$operations" \
        >>"$raw_directory/samples.jsonl"
    done
    sample=$((sample + 1))
  done
}

run_speed() {
  speed_raw_directory="tmp/measurements/speed/$session_id"
  speed_report_directory="reports/measurements/speed/$environment_id"
  progress "speed: cold-start"
  run_speed_series cold-start
  progress "speed: warm"
  run_speed_series warm
  progress "speed: end-to-end"
  run_speed_series end-to-end
  node --import tsx benchmark/report.ts \
    speed "$speed_raw_directory" "$speed_report_directory"
  printf 'Speed raw data: %s\n' "$speed_raw_directory"
  printf 'Speed report: %s\n' "$speed_report_directory"
}

run_memory_series() {
  memory_mode=$1
  workload=$2
  series_name="$memory_mode-$workload"
  raw_directory="tmp/measurements/memory/$session_id/$series_name"
  mkdir -p "$raw_directory"
  : >"$raw_directory/samples.jsonl"
  PALIM_RUN_ID="$session_id-memory-$series_name"
  export PALIM_RUN_ID
  node --import tsx benchmark/measure.ts metadata memory "$series_name" \
    >"$raw_directory/run.json"

  memory_cases=$(node --import tsx benchmark/measure.ts cases memory)
  sample=1
  while [ "$sample" -le "$samples" ]; do
    printf '%s\n' "$memory_cases" |
      while IFS="$(printf '\t')" read -r case_workload case_name count name; do
        if [ "$case_workload" != "$workload" ]; then
          continue
        fi
        pair_id="$series_name-$sample-$name"
        if [ "$memory_mode" = retained ]; then
          node --expose-gc --import tsx benchmark/measure.ts \
            memory "$memory_mode" baseline "$workload" "$case_name" \
            "$count" "$name" "$sample" "$pair_id" \
            >>"$raw_directory/samples.jsonl"
          node --expose-gc --import tsx benchmark/measure.ts \
            memory "$memory_mode" parse "$workload" "$case_name" \
            "$count" "$name" "$sample" "$pair_id" \
            >>"$raw_directory/samples.jsonl"
        else
          node --import tsx benchmark/measure.ts \
            memory "$memory_mode" baseline "$workload" "$case_name" \
            "$count" "$name" "$sample" "$pair_id" \
            >>"$raw_directory/samples.jsonl"
          node --import tsx benchmark/measure.ts \
            memory "$memory_mode" parse "$workload" "$case_name" \
            "$count" "$name" "$sample" "$pair_id" \
            >>"$raw_directory/samples.jsonl"
        fi
      done
    sample=$((sample + 1))
  done
}

run_memory() {
  memory_raw_directory="tmp/measurements/memory/$session_id"
  memory_report_directory="reports/measurements/memory/$environment_id"
  for memory_mode in peak retained; do
    for workload in single scaling sequential concurrent; do
      progress "memory: $memory_mode/$workload"
      run_memory_series "$memory_mode" "$workload"
    done
  done
  node --import tsx benchmark/report.ts \
    memory "$memory_raw_directory" "$memory_report_directory"
  printf 'Memory raw data: %s\n' "$memory_raw_directory"
  printf 'Memory report: %s\n' "$memory_report_directory"
}

case "$domain" in
  all)
    run_speed
    run_memory
    ;;
  speed) run_speed ;;
  memory) run_memory ;;
esac
