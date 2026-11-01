# ADR-0014: Document element creation API の追加

## ステータス

accepted

## コンテキスト

palim の `Document` は parser の内部では element を生成できるが、利用者が `Document` を通して element を生成する API を持たない。

HTML parser、XML parser、および HTML element interface の生成処理がすでに存在するため、公開 API の追加によって element の名前、namespace、および runtime interface の選択処理を重複させない構成が必要になる。

対象 API の検証方法と、WPT の扱いを決める必要がある。

## 決定

- `Document.createElement()` と `Document.createElementNS()` を同じ実装単位として追加する
- parser と `Document` API が使用する element 生成処理を共通の factory に集約する
- custom element registry と customized built-in element の生成は本 ADR に含めない
- 公開 API を通す project test を作成し、WHATWG DOM の algorithm を期待結果の根拠とする

## 影響

- parser と公開 API の element 生成結果を同じ処理経路で維持できる
- HTML document、XML document、および XHTML document の差異を公開 API から検証できる
- custom element の生成は Custom Elements の実装時に追加する必要がある

## 代替案

### `createElement()` と `createElementNS()` を別々に追加する

名前と namespace の処理、および element interface の選択を別々の変更で導入することになるため採用しない。

### WPT adapter を実装する

WPT が要求する browser global、複数 realm、iframe、および testharness の実行条件を palim が提供していないため採用しない。

## 参考資料

- [ADR-0007](./0007-html-element-interfaces.md)
- [ADR-0013](./0013-xml-parsing.md)
- [WHATWG DOM: `Document.createElement()`](https://dom.spec.whatwg.org/#dom-document-createelement)
- [WHATWG DOM: `Document.createElementNS()`](https://dom.spec.whatwg.org/#dom-document-createelementns)
- [WPT: `Document-createElement.html`](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/Document-createElement.html)
- [WPT: `Document-createElementNS.html`](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/Document-createElementNS.html)
- [WPT: `Document-createElement-namespace.html`](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/Document-createElement-namespace.html)
