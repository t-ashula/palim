# ADR-0003: パース速度の継続計測

## ステータス

accepted

## コンテキスト

palim は revision、profile、capability ごとのパース速度を、継続して計測・記録できる必要がある。

JavaScript の計測値は process startup、JIT、GC、module cache、実行ホストの状態に影響される。一回の実行値だけでは速度の傾向と実行時のばらつきを把握できないため、計測条件、複数の sample、生データ、実行環境を一緒に記録する必要がある。

## 決定

- 1 回の run は、一つの palim revision、一つの profile、一つの capability 構成、一つの計測 mode を対象とする
- cold start、warm parse、end-to-end、streaming を別の計測系列とする
- warm parse では入力準備と検証を計測区間から外し、parse と要求された出力構築を測る
- wall-clock 時間は実行環境が提供する高分解能タイマーで計測する
- 計測結果を tree hash、node 数、token 数などで検証する
- 速度とメモリで同じ version 管理された corpus を使用する
- duration、throughput、p50、p95、ばらつき、raw sample、実行環境を保存する
- raw sample は実行時生成物として保存し、比較に必要な最終レポートは機械可読な形で version 管理する
- 最終レポートと同じ内容の人間向けレポートを決定的に生成する

## 影響

- revision、profile、capability ごとの速度計測結果を継続して蓄積できる
- cold start と warm parse を独立した計測値として扱える
- child process による実行、corpus 管理、結果検証、統計集計、レポート生成の仕組みが必要になる
- 安定した計測系列には実行環境の固定と環境情報の記録が必要になる
- 単一回の計測より実行時間と保存データ量が増える
- 計測結果の更新ごとに version 管理された最終レポートの差分が発生する

## 代替案

### 一つの実行値だけを保存する

実行時のばらつきを把握できないため採用しない。

### 一つの process で全 sample を実行する

JIT、GC、module cache、実行順の影響を sample 間で分離できないため採用しない。

### 集計値だけを保存する

集計方法の変更と計測値の調査に必要な情報が残らないため採用しない。

## 備考

計測を呼び出す契機は、この ADR では決めない。commit、push、PR、定期実行、release などへの接続は、開発フローを定める別の ADR で決定する。

## 参考資料

- [Design log](../design-log/0003-speed-measurement.md)
- [Node.js 24: `process.hrtime.bigint()`](https://nodejs.org/docs/latest-v24.x/api/process.html#processhrtimebigint)
- [Node.js 24: Performance measurement APIs](https://nodejs.org/docs/latest-v24.x/api/perf_hooks.html)
