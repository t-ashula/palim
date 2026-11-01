# ADR-0016: node cloning と adoption API の追加

## ステータス

accepted

## コンテキスト

palim は node の挿入時に document 間の所有関係を更新できるが、node の複製、import、および明示的な adoption を行う公開 API を持たない。

HTML parser は一部の処理で独自の clone 処理を持ち、DOM の挿入処理は内部の adoption 処理を持っている。公開 API の追加によって同種の処理を増やさず、node type ごとの複製と所有 document の更新を一貫させる構成が必要になる。

## 決定

- `cloneNode()`、`importNode()`、および HTML parser の既存 clone 処理で、複製先の `Document` を指定できる内部 clone 処理を共有する
- `adoptNode()` と document 間の node 挿入で内部 adoption 処理を共有する
- 公開 API を通す project test を作成し、WHATWG DOM の algorithm を期待結果の根拠とする

## 影響

- node の複製と import で node type ごとの生成処理を共通に保てる
- 明示的な adoption と挿入に伴う adoption で同じ所有関係更新処理を使用できる
- HTML parser 内の限定的な clone 処理を DOM の内部処理へ集約できる

## 代替案

### 公開 API と parser で clone 処理を分ける

element interface、属性、および子孫の複製処理が重複するため採用しない。

### `adoptNode()` 専用の所有関係更新処理を追加する

document 間の node 挿入と異なる更新経路を持つことになるため採用しない。

## 参考資料

- [ADR-0014](./0014-document-element-creation.md)
- [ADR-0015](./0015-document-node-creation.md)
- [WHATWG DOM: `Node.cloneNode()`](https://dom.spec.whatwg.org/#dom-node-clonenode)
- [WHATWG DOM: `Document.importNode()`](https://dom.spec.whatwg.org/#dom-document-importnode)
- [WHATWG DOM: `Document.adoptNode()`](https://dom.spec.whatwg.org/#dom-document-adoptnode)
