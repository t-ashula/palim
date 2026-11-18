# ADR-0061: Selection API state

## ステータス

accepted

## コンテキスト

palim は live `Range` と DOM mutation による boundary point の更新を提供しているが、`Selection` object、Document と Window の `getSelection()`、および選択中の `Range` を保持する状態を提供していない。

Selection API では browsing context を持つ Document ごとに一つの selection が関連付き、Document と対応する Window は同じ `Selection` object を返す。browsing context を持たない Document は selection を持たない。

Selection は一つの live `Range`、anchor、focus、および direction を保持し、DOM mutation で `Range` の boundary point が更新された後も同じ `Range` との関連を維持する。

Selection API を追加するには、Document に関連付く状態、Window と Document から返す object identity、live `Range` の再利用、および page realm への interface 公開を所有する package を定める必要がある。

## 決定

- Selection API Standard に従い、script から操作できる `Selection` を提供する
- `@palim/core` は Document に関連付く selection state、選択中の live `Range`、anchor、focus、および direction を所有する
- `@palim/window` は browsing context を持つ Document と Window の対応を使用し、Window から対応する Document の selection を取得する API behavior を提供する
- `@palim/scripting` は Window realm へ `Selection` interface、Document と Window の `getSelection()`、値の変換、および page realm exception の処理を提供する
- Document と対応する Window は同じ selection state を参照し、同じ page realm では同じ `Selection` object identity を維持する
- browsing context を持たない Document の `getSelection()` は `null` を返す
- Selection に関連付けた `Range` は既存の live `Range` として DOM mutation の更新を受け、Selection は同じ `Range` との関連を維持する
- 既存 layout が提供する element box、text advance、および line wrapping は変更せず、Text node の文字 offset と caret 座標の相互変換、pointer または keyboard 入力による選択の生成、form control 内部の選択、および caret geometry に依存する selection movement はこの決定では追加しない

## 影響

- Document ごとに selection state の有無と object identity を管理する必要がある
- `Selection` が保持する anchor、focus、および direction と、`Range` の tree-order boundary point を相互に変換する必要がある
- selection を変更する API は、異なる Document の node、無効な offset、および関連付いていない `Range` を仕様どおり処理する必要がある
- DOM mutation 後の selection は、既存の live `Range` 更新結果を返す必要がある
- Document と Window の破棄後に selection state と page realm wrapper を保持し続けない管理が必要になる
- user interaction による selection を追加する場合は、既存 layout が計算する text segment を Text node と文字 offset に対応付け、caret hit testing と caret rectangle を提供する必要がある
- pointer または keyboard 入力による selection を追加する場合は、Window event processing と caret geometry の使用方法を別に決定する必要がある

## 代替案

### Window ごとに selection state を保持する

Document を対応する Window から切り離す場合と browsing context を持たない Document の `null` を表現しにくく、DOM mutation を所有する Document と live `Range` から状態が分離するため採用しない。

### page realm の JavaScript object だけで selection state を保持する

DOM mutation による live `Range` の更新を再利用できず、同じ Document を異なる API から参照したときの state と object identity を一貫して管理できないため採用しない。

### 選択範囲を `Range` とは別の boundary point として保持する

既存の live `Range` 更新処理と同じ DOM mutation algorithm を重複して実装することになるため採用しない。

## 参考資料

- [ADR-0027](./0027-window-execution-environment.md)
- [ADR-0047](./0047-window-scripting-separation.md)
- [ADR-0049](./0049-page-realm-execution-contract.md)
- [Selection API](https://w3c.github.io/selection-api/)
- [DOM Standard: Ranges](https://dom.spec.whatwg.org/#ranges)
