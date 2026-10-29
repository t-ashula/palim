# ADR-0004: メモリ使用量の継続計測

## ステータス

accepted

## コンテキスト

palim は入力サイズ、出力表現、parser profile に対するメモリコストを継続的に比較できる必要がある。

## 決定

- Peak RSS、Incremental Peak RSS、retained memory、managed heap、externally allocated memory を別々の指標として保存する
- Peak RSS は実行環境が提供する high-water mark を取得し、bytes へ正規化する
- baseline process と parse process を同じ条件で別々に起動し、その差から parser の増分を求める
- parser、profile、case、sample は fresh child process で分離する
- retained memory は GC を明示的に実行できる専用モードで測り、GC 前後の値を両方保存する
- 入力 bytes、入力表現、出力表現、node 数を記録し、memory amplification と bytes per node を算出する
- 単一文書、入力サイズの scaling、多数文書の sequential processing、複数文書の concurrent retention を別系列で測る
- 速度計測と同じ version 管理されたコーパスと同等の出力要件を使う
- 同一ホスト上の baseline と candidate を比較し、生の sample と実行環境を保存する
- raw sample は実行時生成物として保存し、比較に必要な最終レポートは機械可読な形で version 管理する
- 最終レポートと同じ内容の人間向けレポートを決定的に生成する

## 影響

- parser の一時的な Peak RSS と保持される tree のコストを分けて評価できる
- 入力サイズや文書数に対するメモリ増加の傾きを追跡できる
- baseline と parse の対になる process、GC 専用モード、複数 workload の runner が必要になる
- allocator、JavaScript runtime、OS の違いをまたいだ直接比較はできない
- 計測回数が増え、速度計測以上に実行時間を要する可能性がある
- 計測環境ごとに version 管理された最終レポートを保守する必要がある

## 代替案

### managed heap の使用量だけを使う

native allocation、externally allocated memory、managed heap が確保済みの未使用領域を捉えられないため採用しない。

### parse 前後の RSS 差だけを使う

RSS の瞬間値は短い peak を取り逃がし、process の high-water mark を表さないため採用しない。

### heap snapshot を継続計測に使う

取得自体の時間とメモリ負荷が大きいため採用しない。保持原因を調査する診断手段として使用する。

## 備考

計測を呼び出す契機と、その結果を変更の統合条件にするかどうかは、この ADR では決めない。commit、push、PR、定期実行、release などへの接続は、開発フローを定める別の ADR で決定する。

## 参考資料

- [Design log](../design-log/0004-memory-measurement.md)
