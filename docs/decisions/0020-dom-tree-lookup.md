# ADR-0020: DOM tree lookup API の追加

## ステータス

accepted

## コンテキスト

palim は selector API を通じて descendant element を検索できるが、`Document` と `Element` の `getElementsByTagName()`、`getElementsByTagNameNS()`、`getElementsByClassName()`、および `Document` と `DocumentFragment` の `getElementById()` を持たない。

selector engine は内部で descendant element を tree order に列挙しているが、その処理は selector 実装内に閉じている。
また、`querySelectorAll()` は検索時の結果を保持する `NodeList` を返すため、変更後の tree を参照する `HTMLCollection` の構築には使用できない。

既存の `HTMLCollection` は値を取得する callback を保持しており、`children` の変更を都度反映している。lookup API を追加する際には、tree traversal を重複させず、この collection 構造へ接続する必要がある。

## 決定

- selector engine の descendant element 列挙処理を DOM の内部処理へ移し、selector API と lookup API で共有する
- collection を返す lookup API は、アクセス時に共通の列挙処理を実行する既存の `HTMLCollection` で構成する
- `getElementById()` は共通の列挙処理から最初の一致を取得し、selector engine には委譲しない
- 公開 API を通す project test を作成し、WHATWG DOM の algorithm を期待結果の根拠とする

## 影響

- selector API と lookup API の tree order を同じ列挙処理に保てる
- lookup collection は tree mutation 後の状態を既存の `HTMLCollection` の仕組みで反映できる
- ID や tag name を CSS selector 文字列へ変換する処理を追加せずに検索できる

## 代替案

### selector engine を lookup API から呼び出す

CSS selector の構文処理と escaping が lookup API に入り、`querySelectorAll()` の静的な結果を live collection に変換する別処理も必要になるため採用しない。

### lookup API ごとに descendant traversal を実装する

selector engine を含む複数箇所で tree order の列挙処理が重複するため採用しない。

### lookup の結果を生成時の配列として保持する

tree mutation 後の状態を既存の `HTMLCollection` と同じ方法で反映できないため採用しない。

## 参考資料

- [WHATWG DOM: `NonElementParentNode`](https://dom.spec.whatwg.org/#interface-nonelementparentnode)
- [WHATWG DOM: `Document`](https://dom.spec.whatwg.org/#interface-document)
- [WHATWG DOM: `Element`](https://dom.spec.whatwg.org/#interface-element)
- [WHATWG DOM: collections](https://dom.spec.whatwg.org/#old-style-collections)
