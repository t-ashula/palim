# ADR-0043: WPT DOM shell profile による適合度計測

## ステータス

accepted

## コンテキスト

ADR-0033 で接続した WPT browser profile は browser environment 全体を検証する。
この結果だけでは DOM operation の失敗を他の実行層の不足から分離できず、DOM implementation の変更を短い周期で外部 test suite により確認することも難しい。

一方、palim project が対象仕様を解釈して期待値を作る project test は、実装と同じ解釈の誤りを共有し得る。
project test は回帰検出には使用できるが、仕様適合度の根拠にはしにくい。

固定している WPT は JavaScript shell 上で testharness を動かす機構を持つが、その scope は DOM を公開しない。
upstream test と期待値を変更せずに palim の公開 interface へ接続する、独立した host profile が必要である。

## 決定

- WPT browser profile と独立した conformance 系列として WPT DOM shell profile を追加する
- DOM shell profile は固定した revision の upstream WPT を変更せず使用する
- runner は隔離した execution unit で palim package と WPT を同じ JavaScript realm に接続する
- test に公開する host capability を明示し、runtime が持つ Web API を palim の代替として使用しない
- runner による local resource 解決と、test 対象の web platform capability を分離する
- 最初の profile は単一の active document で完結する test を対象とし、host contract を越える test は browser profile に分類する
- test の選択は固定した scope と機械的な capability 条件から決定し、個別 test の成否によって変更しない
- profile 内の未実装 capability は事前除外せず、upstream WPT の結果として記録する
- DOM shell profile の結果は他の検証系列と分離し、母数と合格数を合算しない
- project test は runner の回帰検出に使用し、DOM shell profile の適合度へ算入しない

## 影響

- page realm binding、engine262、および browser environment の実装状況から分離して、upstream WPT による DOM operation の結果を確認できる
- upstream WPT の期待値を palim project 内で再記述せず、外部 test suite としての独立性を維持できる
- Node.js の Web API が test context へ混入して palim の不足を補うことを防げる
- DOM shell profile は WPT が定義する `jsshell` scope そのものではなく、palim 固有の host profile として識別する必要がある
- HTML test document の fixture 構築、script 順序、helper resource、および完了通知を扱う runner が必要になる
- browser lifecycle に依存する test と、palim の未実装 DOM capability により失敗した test を別の分類として保持する必要がある
- 同じ WPT source が DOM shell profile と browser profile の両方で実行される場合も、実行環境を含む別の結果として扱う必要がある

## 代替案

### DOM Standard を基に project test を追加する

実装と test が同じ仕様解釈を共有し、外部 test suite による適合度の根拠にならないため、回帰検出に限定する。

### WPT browser profile だけを使用する

DOM operation と page realm binding、engine、Window、および lifecycle の失敗を分離できず、DOM implementation の検証周期も長いため採用しない。

### WPT test を Vitest test へ書き換える

assertion、test lifecycle、fixture、および期待値を palim project 側で再実装することになり、upstream source との同一性を維持できないため採用しない。

### Node.js の global Web API をそのまま使用する

palim が提供していない interface を Node.js が補い、結果の対象 implementation を判別できなくなるため採用しない。

### 実行可能と確認した個別 test だけを列挙する

実装状況に応じて母集団を縮小でき、適合度の推移を比較できなくなるため採用しない。

## 参考資料

- [Design log](../design-log/0043-wpt-dom-shell-profile.md)
- [ADR-0002](./0002-compliance-measurement.md)
- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0033](./0033-wptrunner-product-integration.md)
- [ADR-0035](./0035-wpt-document-resource-loading.md)
- [ADR-0038](./0038-wpt-progress-report.md)
- [ADR-0040](./0040-wpt-partitioned-campaign.md)
- [ADR-0041](./0041-web-idl-realm-binding-boundary.md)
- [WPT testharness documentation](https://web-platform-tests.org/writing-tests/testharness.html)
