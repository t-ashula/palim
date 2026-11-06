# ADR-0042: engine262 の固定 revision とローカルパッチ管理

## ステータス

accepted

## コンテキスト

ADR-0026 は JavaScript engine 固有の処理を engine adapter の背後へ分離し、engine262 の version を固定する必要性を定めている。ADR-0033 により、palim は Window environment の JavaScript engine を使って WPT の page script を実行する。

palim が固定している engine262 revision には、web browser host で必要になる ECMAScript の挙動が不足している場合がある。
現在も engine262 の source へローカルパッチを適用しているが、その採用理由、維持方法、および upstream との関係は設計判断として記録されていなかった。

WPT の resource や実行する source を変更して不足を隠すのではなく、仕様上必要な JavaScript engine の挙動を engine262 の source patch として扱い、再現可能な依存として管理する必要がある。

## 決定

- engine262 は commit revision を固定し、必要なローカルパッチを適用してから palim の依存 package として使用する
- ローカルパッチは、palim が web browser host として必要とする ECMA-262 の仕様上の挙動を engine262 で補う場合に限る
- 特定の WPT、fixture、または failure message だけを通す変更や、page script の書き換えは行わない
- パッチ変更では、既存パッチが解消した挙動を含む engine262 の回帰検証と、影響する個別 WPT の検証を行う
- engine262 revision の更新とローカルパッチの変更は、影響を分離して確認できる単位で扱う
- upstream revision が同等の修正と回帰検証を含む場合は、固定 revision の更新後にローカルパッチを除去する

## 影響

- WPT の実行条件を変えず、JavaScript engine の仕様差を engine262 の source patch として修正できる
- 固定 revision とローカルパッチから同じ engine package を再生成できる
- engine262 の更新時に、パッチの適用可否と upstream の対応状況を確認する必要がある
- palim は upstream に存在しない差分と回帰検証を保守する負担を持つ

## 代替案

### WPT の resource または page script を変更する

upstream WPT と異なる source を実行し、engine262 の仕様上の不足を観測できなくなるため採用しない。

### engine262 を恒久的に fork する

現時点の変更範囲に対して、repository、release、および同期を独立して維持する負担が大きいため採用しない。
ローカルパッチで追跡できない規模になった場合に再検討する。

### engine262 の revision 更新だけで解決する

必要な修正が含まれる保証がなく、今回の仕様差と無関係な変更も同時に取り込むため採用しない。

## 参考資料

- [Design log](../design-log/0042-engine262-local-patch-management.md)
- [ADR-0002](./0002-compliance-measurement.md)
- [ADR-0026](./0026-javascript-engine-connection.md)
- [ADR-0033](./0033-wptrunner-product-integration.md)
- [ECMAScript 2026: Annex B](https://tc39.es/ecma262/2026/multipage/additional-ecmascript-features-for-web-browsers.html)
- [engine262](https://github.com/engine262/engine262)
