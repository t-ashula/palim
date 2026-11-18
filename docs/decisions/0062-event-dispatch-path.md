# ADR-0062: Event dispatch path

## ステータス

accepted

## コンテキスト

palim は DOM event の capture、target、bubble、ShadowRoot を越える配送、および配送先に応じた target の retargeting を提供しているが、page script から配送経路を取得する `Event.composedPath()` を提供していない。

DOM event の配送経路には通常の親子関係だけでなく、slot に割り当てられた node から slot への移動と、ShadowRoot から host への移動が含まれる。closed ShadowRoot 内の経路は、listener の `currentTarget` がどの tree にあるかに応じて `composedPath()` の結果から除外される。

配送中に DOM tree が変更されても、listener が取得する経路は配送開始時に確定した内容を使用する。配送前と配送終了後の `composedPath()` は空の配列を返す。

`Event.composedPath()` を追加するには、event path の構築、closed ShadowRoot 内の経路を公開する範囲、配送中に保持する状態、および page realm へ返す object を所有する package を定める必要がある。

## 決定

- DOM Standard に従い、script から配送中の event path を取得できる `Event.composedPath()` を提供する
- `@palim/core` は event dispatch の開始時に、通常の親子関係、slot assignment、および ShadowRoot と host の関係を使用して event path を確定する
- `@palim/core` は closed shadow tree とその内部の slot による公開範囲を event path とともに保持し、listener の位置から参照できる配送先だけを公開する
- event path は配送中だけ保持し、配送前と配送終了後は空にする
- 配送中の DOM mutation は、その配送について確定済みの event path を変更しない
- `@palim/scripting` は Window realm の `Event.prototype` へ `composedPath()` を公開し、core が返した EventTarget を同じ page realm の既存 wrapper として返す

## 影響

- event dispatch は light tree の親だけでなく assigned slot を経由する配送経路を扱う必要がある
- open と closed の ShadowRoot が入れ子になった場合も、listener ごとに公開できる経路を判定する必要がある
- 同じ event でも listener の `currentTarget` によって `composedPath()` の戻り値が異なる場合がある
- 配送完了時と例外による配送中断時のどちらでも event path を消去する必要がある
- page realm へ返す配列は呼び出しごとに新しく作成し、要素には既存の EventTarget wrapper を使用する必要がある

## 代替案

### 配送対象の EventTarget だけを配列として保持する

closed shadow tree と slot に関する情報が失われ、listener の位置に応じて公開範囲を変えられないため採用しない。

### `composedPath()` の呼び出し時に DOM tree から経路を再構築する

配送中の DOM mutation により配送開始時と異なる経路を返し、実際に listener を呼び出した順序とも一致しなくなるため採用しない。

### closed ShadowRoot 内の entry を常に除外する

closed ShadowRoot 内の listener からは同じ closed tree 内の entry を取得できるという DOM Standard の動作を提供できないため採用しない。

## 参考資料

- [ADR-0027](./0027-window-execution-environment.md)
- [ADR-0047](./0047-window-scripting-separation.md)
- [DOM Standard: Event](https://dom.spec.whatwg.org/#interface-event)
- [DOM Standard: Dispatching events](https://dom.spec.whatwg.org/#concept-event-dispatch)

