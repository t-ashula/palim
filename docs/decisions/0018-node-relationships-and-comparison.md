# ADR-0018: Node の関係・比較 API の追加

## ステータス

accepted

## コンテキスト

palim の `Node` は parent、child、および sibling を公開しているが、node の root、包含関係、文書内位置、および同一性を取得する API を持たない。

tree mutation には ancestor を調べる内部処理が存在する。関係 API ごとに走査処理を追加すると、同じ tree に対する root、ancestor、および順序の判定が分散する。

また、互いに接続されていない node の相対順序は実装側で一貫した順序を選ぶ必要があるため、その保持方法を決める必要がある。

## 決定

- `getRootNode()`、`contains()`、`compareDocumentPosition()`、`isEqualNode()`、および `isSameNode()` を同じ実装単位として追加する
- root、ancestor、および tree order の判定を内部処理として共有する
- 接続されていない node の相対順序には、比較時に `WeakMap` へ割り当てる単調増加 ID を使用する
- 公開 API を通す project test を作成し、WHATWG DOM の algorithm を期待結果の根拠とする

## 影響

- tree mutation と関係 API の ancestor 判定を共通に保てる
- 接続されていない node の比較結果を同じ node の組み合わせに対して維持できる
- 比較用 ID は node の公開 property や serialization に現れず、比較されない node には割り当てられない

## 代替案

### API ごとに tree 走査を実装する

root、ancestor、および順序の判定が重複するため採用しない。

### 比較用 ID を `Node` の field として生成時に割り当てる

接続されていない node の比較を行わない場合にも、すべての node が比較用の状態を持つため採用しない。

### 接続されていない node の比較時に毎回順序を選ぶ

同じ node の組み合わせに対する比較結果を維持できないため採用しない。

## 参考資料

- [WHATWG DOM: `Node`](https://dom.spec.whatwg.org/#interface-node)
- [WHATWG DOM: node tree](https://dom.spec.whatwg.org/#concept-node-tree)
