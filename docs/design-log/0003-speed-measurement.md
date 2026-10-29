# ADR-0003 Design log: パース速度の継続計測

## 調査の焦点

「パース速度」は、process の起動、module の読み込み、入力の decode、parser の実行、出力の構築をどこまで含めるかによって値が変わる。また、JavaScript の実行時間は JIT、GC、module cache、実行順、host の状態から影響を受ける。

継続計測では、何に要した時間かを区別できること、同じ条件で複数の sample を取得できること、計測結果が正しい parse result から得られたことを確認できることが必要になる。

## 何を測るか

用途の異なる時間を一つの値へまとめると、変化した要因を判断しにくい。計測範囲は次の 4 つに分けて扱う。

| 計測系列 | 開始 | 終了 | 確認できること |
| --- | --- | --- | --- |
| Cold start | child process の起動直前 | 最初の parse result の完成 | process startup と module import を含む初回実行時間 |
| Warm parse | 入力準備と warmup の完了後 | parse result の完成 | parser と要求された出力構築の実行時間 |
| End to end | input bytes の decode 開始 | parse result の完成 | decode を含む一連の処理時間 |
| Streaming | 最初の chunk の投入 | final result の完成 | chunk 入力を使う一連の処理時間 |

各系列では、case ごとの duration と throughput を sample として取得する。profile、capability、palim revision、corpus revision は、その計測値が成立した条件として記録する。

## 入力

入力内容が変わると計測値の意味も変わるため、速度とメモリの計測で共通の version 管理された corpus を使用する。

corpus には、小さい入力だけに偏らず、構造と byte length が異なる case が必要になる。streaming では入力内容に加えて chunk の境界も処理時間へ影響するため、chunk sequence も corpus 側で固定する。

各 case には結果検証に使う値を対応付ける。token 数、node 数、tree hash など、palim API が返す結果に応じた値を使用する。corpus の選定と manifest 形式は、速度計測とメモリ計測に共通する検討事項として残る。

## 計測方法

### Timer

wall-clock 時間には、単調増加する高分解能タイマーが必要になる。Node.js では `process.hrtime.bigint()` が nanosecond 単位の整数を返し、system clock の補正から独立しているため、計測区間の開始と終了に使用できる。

### Sample の分離

同じ process で sample を連続実行すると、前の sample で生じた JIT、GC、module cache、heap 状態が後の sample へ引き継がれる。case と sample を child process へ分ける方式では、sample ごとの process 状態を揃えやすい。

child process の起動時間を含む系列と、起動後の parse だけを測る系列では計測位置が異なる。Cold start は parent process から計測を開始し、Warm parse、End to end、Streaming は child process 内で対象区間を測る。

### Warmup

Warm parse では、module 読み込みと入力準備を終えた後に warmup を行う。warmup 回数を run metadata へ残すことで、後から計測条件を確認できる。

固定回数と安定判定のどちらを使うかは、palim 実装後の予備計測で JIT の挙動を確認して決める。

### 短い case

処理時間が timer の分解能や process 間の揺らぎに近い case では、複数 operation を一つの計測区間へまとめ、operation 数で割って 1 回あたりの値を得る。operation 数は run metadata と raw sample へ記録する。

### 結果検証

速度値は、palim が期待した結果を生成した sample に対して記録する。parse result から検証値を取得し、corpus に対応付けた期待値と照合する。

Warm parse、End to end、Streaming では、検証処理を計測区間の外に置く。計測中の result は検証まで参照を保持し、処理結果が観測される状態を保つ。

## Sample と集計

一回の値では実行時のばらつきを表せないため、同じ条件で複数の sample を取得する。raw sample には duration、operation 数、case、profile、capability、palim revision、corpus revision、計測系列、実行環境を記録する。

集計値は次を候補とする。

- ns / operation
- bytes / second
- p50
- p95
- sample 数
- ばらつきを表す統計量

p50 は典型的な値、p95 は遅い側の分布を確認するために使う。ばらつきに使う統計量と必要な sample 数は、固定環境で取得した分布を見て決める。

## 計測結果の扱い

各 run の raw result は `tmp/measurements/speed/<run-id>/` へ保存する。raw result は sample 単位の調査、集計方法の変更、最終レポートの再生成に使用する。

run 終了後、raw sample から機械可読な summary を生成し、同じ内容の人間向け summary を生成する。summary には case ごとと corpus 全体の集計値、計測条件、実行環境を含める。

継続して残す最終結果は `reports/measurements/speed/` 配下で version 管理する。機械可読なレポートを正本とし、そこから人間向けレポートを決定的に生成する。Git 履歴には、各時点で記録した計測値と計測条件が残る。

最終レポートは、速度特性の確認、遅い case の調査、最適化対象を選ぶ際の資料として使用する。計測を実行する契機と、結果を開発フロー上の判断へ接続する方法は、開発フローを扱う ADR で定める。

## 検討した選択肢

### 一回の実行値と複数 sample

一回の実行値は取得コストが小さい。複数 sample は JIT、GC、host 負荷による分布を記録できる。継続計測では複数 sample と raw result を使用する。

### 同一 process と child process

同一 process は起動コストを抑えられる。child process は sample 間の process 状態を分離し、Cold start も計測できる。継続計測では case と sample を child process で実行する。

### 集計値だけの保存と raw result の保存

集計値だけの保存はデータ量を抑えられる。raw result を残すと、分布の確認と集計方法の変更が可能になる。run 単位の raw result と version 管理する最終レポートを分けて扱う。

## 未決事項

- corpus の選定と manifest 形式
- warmup の終了条件
- 短い case の operation 数を決める方法
- sample 数
- ばらつきに使用する統計量
- 固定計測環境の構成
- streaming API と chunk 条件

## 参考資料

- [ADR-0003](../decisions/0003-speed-measurement.md)
- [Node.js 24: `process.hrtime.bigint()`](https://nodejs.org/docs/latest-v24.x/api/process.html#processhrtimebigint)
- [Node.js 24: Performance measurement APIs](https://nodejs.org/docs/latest-v24.x/api/perf_hooks.html)
