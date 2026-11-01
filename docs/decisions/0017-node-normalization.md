# ADR-0017: Node normalization API の追加

## ステータス

accepted

## コンテキスト

palim の `CharacterData` は生成時の data を保持するが、既存 node の data を更新する内部処理を持たない。
HTML parser は隣接する text data をまとめる際に、既存の `Text` node を新しい node へ置き換えている。

`Node.normalize()` の追加によって別の character data 更新経路を増やさず、parser と DOM API が同じ更新処理と tree mutation 処理を使用する構成が必要になる。

## 決定

- character data を置換および追加する内部処理を設け、`Node.normalize()` と HTML parser の text data 結合で共有する
- normalization に伴う node の削除には既存の tree mutation 処理を使用する
- 公開 API を通す project test を作成し、WHATWG DOM の algorithm を期待結果の根拠とする

## 影響

- normalization と parser で character data の更新方法を共通に保てる
- parser が text data の追加時に既存の `Text` node を維持できる
- 今後の `CharacterData` mutation API から同じ内部処理を使用できる

## 代替案

### `Node.normalize()` 内で data を直接書き換える

parser および今後の `CharacterData` mutation API と異なる更新経路になるため採用しない。

### 結合後の data を持つ新しい `Text` node へ置き換える

既存 node を置き換える処理が parser と normalization に残るため採用しない。

## 参考資料

- [WHATWG DOM: `Node.normalize()`](https://dom.spec.whatwg.org/#dom-node-normalize)
- [WHATWG DOM: replace data](https://dom.spec.whatwg.org/#concept-cd-replace)
