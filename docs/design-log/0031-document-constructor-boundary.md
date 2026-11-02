# ADR-0031 Design log: Standard interface と内部実装の公開境界

## 記録範囲

各 standard が規定する interface member、constructibility、constructor 処理、および生成後の状態はこの文書に転記しない。palim の公開 interface と内部実装の境界、binding の接続、および完了条件だけを記録する。

## 公開 interface

- package entry point から公開する standard 由来 interface は、対応する standard が定義する surface だけを持つ
- method、attribute、constant、static member、constructor、overload、継承、および公開型に palim 固有の追加を残さない
- internal state、owner object、callback、factory、parser、および algorithm helper を公開 interface の引数、返り値、property、または型制約に使用しない
- standard にない機能を必要とする場合は、standard 由来 interface へ追加せず別の package API として扱う
- source module 内で export する内部 API と、package entry point から公開する API を区別する

既存の package export を対象に interface surface を監査する。
standard が定義する interface を新たにすべて実装・公開する作業には広げない。

## 公開 constructor

- package の型定義と runtime の interface object は、対応する Web IDL interface の constructor contract を使用する
- constructor を持つ interface は内部生成用引数を公開しない
- constructor を持たない interface は package 側と engine realm 側のどちらでも constructor call を許可しない
- HTML の構築処理を使用する interface を通常の constructor または一律の illegal constructor として扱わない
- engine realm で生成した object は、呼び出した realm の対応する prototype を使用する platform object とする
- constructible な interface の host と engine realm の constructor は同じ implementation 初期化処理を使用する
- 一回の constructor call ごとに新しい implementation と platform object を生成する

## 内部 object 生成と操作

次の consumer は公開 constructor へ設定値を渡さず、package export に含めない内部生成経路を使用する。

- HTML parser と XML parser
- document、node、character data、および attribute を生成する DOM algorithm
- template contents owner document と clone
- live collection、node list、named node map、および token list
- HTML element と、その関連 object

内部経路は owner document、parser、content type、element factory、取得 callback、関連 element、および algorithm が必要とする状態を受け取れる。これらの型、設定 object、生成関数、および操作関数を package entry point から export しない。

公開 constructor と内部 algorithm は同じ implementation class と binding を使用する。constructor の分離を理由に parser、interface、または realm ごとの implementation を複製しない。

## Binding

- DOM realm binding の interface 登録は、constructible、illegal constructor、および HTML の構築処理を区別する
- constructible な interface は host 側で生成した interface object を、呼び出した engine realm の platform object へ関連付けて返す
- host 側の interface object を engine value として直接公開しない
- realm ごとの constructor、prototype、および platform object identity を維持する
- `Window.document` が返す active `Document` と、`new Document()` が生成する browsing context を持たない `Document` を混同しない
- 本 ADR の実装を理由に、ADR-0027 の初期対象に含まれない interface を Window realm へ追加しない

## Test

各 interface の standard と WPT の IDL harness・interface test を仕様適合の参照先とする。WPT testharness を project test 用に再実装しない。

project test は palim 固有の接続だけを確認する。

- package の公開型と runtime interface から standard にない member と内部生成・操作用 API が除去されている
- constructible な interface と constructor を持たない interface が package と engine realm で同じ区分になる
- engine realm 内の `new Document()` が成功し、その realm の `Document` interface object と prototype を使用する
- constructor call ごと、および realm ごとに platform object と implementation が共有されない
- engine realm の constructor で生成した object の変更を対応する host interface object から観測できる
- binding の内側で実行する JavaScript test source は JavaScript file に分離する
- parser、DOM algorithm、collection、および HTML interface の既存結果を維持する
- package entry point の export と生成された declaration に内部型が現れない

## 完了条件

- package が公開する各 standard 由来 interface に、対応する standard が定義しない member、signature、継承、および型が含まれない
- package 側と engine realm 側で、公開済みの各 interface の member と constructor contract が一致する
- ページ側スクリプトが `new Document()` を実行できる
- package export と engine realm に owner document、parser、factory、callback、関連 object、および内部 helper の指定・呼出手段が公開されない
- constructible な interface の host と engine realm の constructor が同じ implementation 初期化処理を使用する
- parser、DOM algorithm、collection、および HTML interface の生成・操作が内部経路へ移行される
- realm ごとの constructor、prototype、platform object、および implementation の identity が維持される
- package build が生成する declaration に package 非公開の implementation 型が漏れない
- parser-only の import graph に JavaScript engine が含まれない
- project の format、lint、typecheck、test、および build が成功する

## 参考資料

- [ADR-0031](../decisions/0031-document-constructor-boundary.md)
- [ADR-0014](../decisions/0014-document-element-creation.md)
- [ADR-0025](../decisions/0025-dom-interface-binding-implementation.md)
- [ADR-0026 Design log](./0026-javascript-engine-connection.md)
- [ADR-0027 Design log](./0027-window-execution-environment.md)
- [WHATWG Web IDL: Interface object](https://webidl.spec.whatwg.org/#dfn-interface-object)
- [WHATWG DOM: `Document`](https://dom.spec.whatwg.org/#document)
- [WPT: `Document-constructor.html`](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/Document-constructor.html)
- [WPT: `Document-constructor-xml.xml`](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/Document-constructor-xml.xml)
- [WPT: `Document-constructor-svg.svg`](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/Document-constructor-svg.svg)
