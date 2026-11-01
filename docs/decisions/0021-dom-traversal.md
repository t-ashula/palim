# ADR-0021: NodeIterator と TreeWalker の内部構成

## ステータス

accepted

## コンテキスト

palim は `NodeIterator`、`TreeWalker`、`NodeFilter`、および `Document` の traversal object 生成 API を持たない。

既存の tree traversal は descendant element の配列を生成する処理であり、任意の node type、双方向の移動、filter、および traversal 中の tree mutation を扱う状態を持たない。

`NodeIterator` と `TreeWalker` は tree order と filter 評価を共有できる一方、保持する位置と node removal 時の扱いが異なる。
両者の状態を同じ実装へまとめず、tree navigation の重複だけを避ける構成が必要である。

## 決定

- `NodeIterator` と `TreeWalker` はそれぞれ独立した状態を持つ実装とし、一方を他方へ委譲しない
- tree order の前後移動、ancestor・child・sibling の探索、および filter 評価を副作用のない traversal helper として分離し、両実装で共有する
- `NodeIterator` は node document に関連付けた弱参照の registry で追跡し、node removal の共通処理から removal 前の位置調整を呼び出す
- `TreeWalker` は node removal の registry には登録しない
- project test は `Document` の公開 API から traversal object を生成し、内部 helper を直接使用しない
- project test の期待結果は WHATWG DOM の traversal algorithm を根拠とし、tree mutation を含む状態遷移も対象にする

## 影響

- traversal object 固有の状態を混同せず、tree navigation と filter 評価の重複を避けられる
- node removal 処理に `NodeIterator` の位置調整を接続する必要がある
- registry が `NodeIterator` の生存期間を延長しない
- 既存の descendant element 列挙処理を共通 traversal helper に接続できる

## 代替案

### tree を配列へ変換して走査する

生成後の tree mutation と traversal の位置を対応させる別処理が必要になるため採用しない。

### NodeIterator と TreeWalker の一方を他方で実装する

位置の表現と node removal 時の扱いが異なり、共有すべきでない状態まで結合するため採用しない。

### NodeIterator を強参照の registry で保持する

利用側から参照されなくなった iterator の生存期間を node document が延長するため採用しない。

## 参考資料

- [WHATWG DOM: Traversal](https://dom.spec.whatwg.org/#traversal)
- [WHATWG DOM: Interface NodeIterator](https://dom.spec.whatwg.org/#interface-nodeiterator)
- [WHATWG DOM: Interface TreeWalker](https://dom.spec.whatwg.org/#interface-treewalker)
- [WHATWG DOM: Interface NodeFilter](https://dom.spec.whatwg.org/#interface-nodefilter)
