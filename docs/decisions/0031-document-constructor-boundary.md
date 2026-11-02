# ADR-0031: Standard interface と内部実装の公開境界

## ステータス

accepted

## コンテキスト

package が公開している standard 由来のインタフェースに、standard に定義のない、内部 object の生成と操作に使う API が公開されてしまっている。

Web IDL interface には、公開 constructor を持つもの、constructor call を許可しないもの、および HTML 側の構築処理を使用するものがある。
現在の package export はこの区別と一致せずコンストラクタを呼べないクラスが出来てしまっている。

公開 interface と内部 algorithm が object を生成・操作する経路が分離されておらず、ADR-0025 と ADR-0026 で定めた interface、binding、および implementation の境界が package API に反映されていない。

## 決定

- package が公開する standard 由来 interface を、対応する standard の定義に限定する
- 内部 API と palim 固有 API を standard 由来 interface から分離する
- host と engine realm は implementation を共有し、realm ごとの binding を使用する
- 新しい realm exposure は追加せず、既存の parser と DOM の挙動を維持する

## 影響

- package 利用者とページ側スクリプトが参照する interface surface が対応する standard と一致する
- 公開 member と constructor から各 standard 存在しないものは除去される
- parser、node 生成、collection、token list、および HTML element の生成・操作を内部経路へ移行する必要がある
- DOM realm binding は constructible な interface が返す platform object を、呼び出した realm の interface object と関連付ける必要がある
- package の型定義では、constructor を持たない interface object を constructible な class として公開できなくなる
- standard にない既存の公開 member と constructor signature の削除は破壊的変更になる

## 代替案

### 公開 constructor に内部生成用引数を残す

内部依存が package API に残り、host binding と engine realm binding の contract も一致しないため採用しない。

### engine realm の constructor だけを個別に修正する

ページ側の挙動だけを修正しても、package が公開する constructor に内部生成用引数が残り、interface ごとの処理も重複するため採用しない。

### interface ごとに内部用 subclass を追加する

interface と implementation の継承関係が重複し、binding ごとに別の object model を持つことになるため採用しない。

### standard にない member を互換用 alias として残す

standard 由来 interface に palim 固有の surface が残り、公開境界を判定できないため採用しない。

## 参考資料

- [Design log](../design-log/0031-document-constructor-boundary.md)
- [ADR-0014](./0014-document-element-creation.md)
- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0026](./0026-javascript-engine-connection.md)
- [ADR-0027](./0027-window-execution-environment.md)
- [WHATWG Web IDL: Interface object](https://webidl.spec.whatwg.org/#dfn-interface-object)
- [WHATWG DOM: `Document`](https://dom.spec.whatwg.org/#document)
- [WPT: `Document-constructor.html`](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/Document-constructor.html)
