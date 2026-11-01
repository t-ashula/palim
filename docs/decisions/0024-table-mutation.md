# ADR-0024: table mutation と collection ordering の共有

## ステータス

accepted

## コンテキスト

palim は `HTMLTableElement`、`HTMLTableSectionElement`、`HTMLTableRowElement` の mutation API と live collection を公開している。

現在の project test は、空の `table` に `tbody`、`tr`、`td` を順に追加する経路だけを検証している。
複数の `thead`、`tbody`、`tfoot`、および `table` 直下の `tr` が混在する場合は、collection の順序と tree order が一致しないことがある。
挿入先の決定と index の検証を各 interface で個別に行うと、collection が示す位置と mutation の位置が分岐する。

既存の DOM mutation は node の ownership、live range、および traversal の状態更新を扱うため、table 固有の処理と DOM mutation の責務も分ける必要がある。

## 決定

- table、table section、および table row の collection ordering、index 解決、挿入先の決定を内部の table behavior に集約する
- live collection と mutation API は、同じ table behavior が生成する順序を使用する
- table behavior は挿入または削除する node と位置を決定し、実際の tree 変更は core DOM の mutation 処理を使用する
- table element の生成は既存の HTML element 生成処理を共有する
- project test は公開された table API と core DOM API で tree を構築し、内部の table behavior を直接使用しない

## 影響

- `rows`、`tBodies`、`cells` と、index を受け取る mutation API の位置解釈を共通に保てる
- table 固有の順序規則を `HTMLTableElement`、`HTMLTableSectionElement`、`HTMLTableRowElement` の各 class に重複して持たずに済む
- table API による変更も、他の DOM API と同じ ownership と live range の更新を通る
- 複数 section、空の collection、`-1`、範囲外 index、および mutation 後の live collection を公開 API から検証できる

## 代替案

### 各 interface class に mutation algorithm を置く

collection ordering、index の変換、および挿入位置の判定が class ごとに分かれ、同じ table structure に対する位置解釈を共有できないため採用しない。

### table behavior が node tree を直接変更する

core DOM の mutation 処理と別の変更経路になり、ownership と live range の更新を重複して扱うことになるため採用しない。

### collection を常に tree order で構築する

table の論理的な row ordering と mutation API の index が一致しなくなるため採用しない。

## 参考資料

- [ADR-0019](./0019-element-attributes-and-collections.md)
- [ADR-0022](./0022-live-range.md)
- [WHATWG HTML: The `table` element](https://html.spec.whatwg.org/multipage/tables.html#the-table-element)
- [WHATWG HTML: The `tbody`, `thead`, and `tfoot` elements](https://html.spec.whatwg.org/multipage/tables.html#the-tbody-element)
- [WHATWG HTML: The `tr` element](https://html.spec.whatwg.org/multipage/tables.html#the-tr-element)
