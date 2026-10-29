# ADR-0004 Design log: メモリ使用量の継続計測

## 目的

メモリ計測の調査結果を、Peak RSS と retained memory を分離して再現できる harness の構成へ整理する。最終的な判断は ADR-0004 に置く。

## 構成

速度計測の corpus manifest と parser adapter を共有し、memory 専用の parent runner と child worker を追加する。

```text
benchmark/
  corpus/
  adapters/
  memory/
    run.ts
    baseline-worker.ts
    parse-worker.ts
    sequential-worker.ts
    report.ts
```

worker の stdout は machine-readable result 専用とし、診断 log は stderr へ出す。

raw result と最終レポートは次へ分離する。

```text
tmp/measurements/memory/<run-id>/
  run.json
  samples.jsonl
  summary.json
  summary.md

reports/measurements/memory/<environment-id>/
  report.json
  report.md
```

`tmp/measurements/memory/<run-id>/` は version 管理せず、必要に応じて実行環境の artifact として保存する。

`reports/measurements/memory/<environment-id>/` は比較・追跡に必要な最終結果として version 管理する。速度 report と同じ environment ID / fingerprint の規則を使う。

## 計測点

`process.memoryUsage()` の値を次の checkpoint で取得する。

| Checkpoint | 状態 |
| --- | --- |
| `ready` | module import と入力準備後、parse 前 |
| `held` | parse 完了後、結果を強参照で保持 |
| `held-after-gc` | 結果を保持したまま明示 GC 後 |
| `released-after-gc` | 結果を解放して明示 GC 後 |

各 checkpoint で `rss`、`heapTotal`、`heapUsed`、`external`、`arrayBuffers` を保存する。process 終了前に `process.resourceUsage().maxRSS` を取得し、KiB から bytes へ変換して保存する。

`held-after-gc` と `released-after-gc` は `--expose-gc` を付けた retained-memory mode だけで取得する。GC の呼び出し回数と event-loop turn の入れ方を固定し、run metadata に記録する。通常の Peak RSS mode では強制 GC を行わない。

## Baseline と parse の対

Peak RSS は process 内でリセットできないため、1 sample を次の2 process で構成する。

### Baseline worker

1. adapter module を import する。
2. corpus input を指定表現で読み込む。
3. parse を行わず checkpoint と maxRSS を記録する。
4. 終了する。

### Parse worker

1. baseline と同じ import と入力準備を行う。
2. parse して結果を保持する。
3. checksum と node 数を検証する。
4. checkpoint と maxRSS を記録する。
5. 終了する。

parent runner は同じ round、host、adapter、profile、case の baseline と parse を pair にする。

```text
incremental peak RSS = parse maxRSS - baseline maxRSS
peak amplification = incremental peak RSS / input bytes
retained amplification = retained heap delta / input bytes
bytes per node = retained heap delta / node count
```

負の差分を 0 に丸めず raw result に残す。summary でノイズの可能性を注記する。

## Workload

### Single document

各 sample を fresh process で実行する基本系列。parser 間、profile 間、case 間の比較に使う。

### Scaling

同じ構造を複数の入力サイズで生成し、Peak RSS、retained heap、node 数に対する傾きを得る。不連続な増加が起きるサイズも保存する。

### Sequential documents

1 process で文書を parse、検証、解放する処理を繰り返す。一定間隔で GC 後の heap と RSS を保存し、plateau するか増加し続けるかを見る。

### Concurrent retention

同じ process で複数の parse result を保持する。保持数は corpus manifest または run configuration で固定し、1、2、4、8、16 を初期候補とする。

pathological input の OOM、timeout、resource budget は robustness 計測へ分離する。

## 結果形式

速度計測と同じ run metadata を使い、sample ごとに次を追加する。

- workload kind
- baseline / parse の pair ID
- checkpoint ごとの memoryUsage
- maxRSS bytes
- input bytes と入力表現
- output kind、node count、checksum
- incremental Peak RSS
- amplification と bytes per node
- GC mode、GC count

raw sample は JSON Lines で保存し、absolute value と baseline 差分の両方を summary に出す。

## 最終レポート

`reports/measurements/memory/<environment-id>/report.json` を最終結果の正本とし、同じ path を更新して履歴を git history で保持する。run ごとの report file を repository に蓄積しない。

`report.json` は少なくとも次を持つ。

- report schema version と environment ID / fingerprint
- candidate と baseline の revision
- corpus manifest の digest
- adapter version、profile、feature flags、output kind、workload kind
- case 別と corpus 全体の Peak RSS、Incremental Peak RSS、retained heap、external、ArrayBuffers
- memory amplification、bytes per node、p50、p95、最小値、最大値
- baseline との差分率と回帰判定
- sample 数、GC mode、GC count
- source run ID、`run.json`、`samples.jsonl`、`summary.json` の digest

`report.md` は `report.json` だけから決定的に生成する。case と key の並び順、数値の丸め方、単位を固定し、生成時刻や一時 path を含めない。

## 実行順と sample

baseline と candidate を同じ host で交互に実行する。各 pair は fresh process を使い、Node.js、V8、OS、allocator が異なる結果を同じ分布へ混ぜない。

sample 数は実測ノイズを見て決定する。Peak RSS の分布について median、p95、最小値、最大値を出し、1 MiB 未満の差を強い判断材料にしない。

## 自動実行と回帰 gate

runner は baseline revision と candidate revision を入力として受け取り、代表 corpus の single-document mode を同一 host 内で比較できるようにする。scaling、sequential、concurrent は固定 host で実行できる独立した mode とする。baseline revision の選び方は runner では決めない。

初期実装では結果を収集してノイズ幅を把握し、メモリ値だけでは CI を失敗させない。5% かつ 1 MiB 超は調査開始時の候補であり、採用値ではない。

heap snapshot は自動計測に含めず、回帰の原因調査時に手動で取得する。

commit、push、PR、定期実行、release のどこから各 mode を呼ぶか、回帰 gate をどこへ適用するかは開発フローを定める別の ADR で決定する。

## 未決事項

- 明示 GC の回数と event-loop turn の具体的な手順
- allocator 情報の取得方法
- baseline / parse pair の統計手法
- fixed host での container memory limit
- sequential workload の終了条件

## 参考資料

- [ADR-0004](../decisions/0004-memory-measurement.md)
