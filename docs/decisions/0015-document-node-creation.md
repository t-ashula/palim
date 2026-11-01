# ADR-0015: Document node creation API の追加

## ステータス

accepted

## コンテキスト

palim の `Document` は element を生成できるが、text、comment、および document fragment を生成する公開 API を持たない。

これらの node class は parser と既存の DOM 処理ですでに使用されているため、公開 API の追加にあたって別の node 表現や生成経路を導入する必要はない。既存の node 生成処理との接続方法と検証方法を決める必要がある。

## 決定

- `Document.createTextNode()`、`Document.createComment()`、および `Document.createDocumentFragment()` を同じ実装単位として追加する
- 各 API の生成対象には既存の `Text`、`Comment`、および `DocumentFragment` class を使用する
- 公開 API を通す project test を作成し、WHATWG DOM の algorithm を期待結果の根拠とする

## 影響

- parser を介さずに text、comment、および document fragment を生成できる
- parser と公開 API が生成する node の実装を共通に保てる
- node 生成 API の検証を既存の DOM test に追加できる

## 代替案

### API ごとに個別の ADR として追加する

生成対象以外の設計上の差がなく、同じ検証方法を使用するため採用しない。

## 参考資料

- [ADR-0014](./0014-document-element-creation.md)
- [WHATWG DOM: `Document.createTextNode()`](https://dom.spec.whatwg.org/#dom-document-createtextnode)
- [WHATWG DOM: `Document.createComment()`](https://dom.spec.whatwg.org/#dom-document-createcomment)
- [WHATWG DOM: `Document.createDocumentFragment()`](https://dom.spec.whatwg.org/#dom-document-createdocumentfragment)
