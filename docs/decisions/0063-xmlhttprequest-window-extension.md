# ADR-0063: XMLHttpRequest Window extension

## ステータス

accepted

## コンテキスト

palim は Window realm に後付けの Web API を提供する Window extension、network request を実行する host service、および Window task queue を提供しているが、`XMLHttpRequest` を提供していない。

`XMLHttpRequest` は request の設定と response の状態を保持する EventTarget であり、network request の進行に応じて `readystatechange`、`load`、`error`、`abort`、および `loadend` を配送する。response type が document の場合は、response body と MIME type から Document を作成して返す。

`XMLHttpRequest` を追加するには、page realm に属する interface と状態、host network へ渡す request、Window task queue へ戻す response、Document response の作成、および event 配送を所有する package を定める必要がある。

## 決定

- XMLHttpRequest Standard に従い、Window realm へ `XMLHttpRequest` と `XMLHttpRequestEventTarget` を提供する
- `@palim/polyfills` は XMLHttpRequest の request state、response state、state transition、header 処理、および event 配送の順序を所有する
- network request は ADR-0051 の host service を使用し、page realm の object または host runtime 固有の object を host service へ渡さない
- network response による state transition と event 配送は、request を開始した Window の task queue で実行する
- XML または HTML の Document response は `@palim/scripting` が提供する Window realm operation を使用し、response URL、MIME type、および scripting disabled の状態を持つ Document として作成する
- XMLHttpRequest object と配送する Event object は request を開始した Window realm に属する
- Window が active でなくなった場合は、完了していない request の response を page script へ配送しない

## 影響

- Window extension が EventTarget を継承する interface と event handler attribute を定義できる必要がある
- host network の完了を同期的に page script へ返さず、Window task queue へ enqueue する必要がある
- request body と response body を page realm の value と host service の byte sequence の間で変換する必要がある
- response type、MIME type、および charset に応じて text、bytes、または Document を生成する必要がある
- abort、network error、および inactive Window を区別して request state を終了させる必要がある

## 代替案

### `@palim/scripting` に XMLHttpRequest 全体を実装する

network API の状態と request algorithm が JavaScript engine 接続を所有する package に入り、ADR-0051 の Window extension と host service による追加方法を再利用できないため採用しない。

### host の XMLHttpRequest object を Window global に設定する

page realm の interface identity、EventTarget 継承、Event object、および例外を維持できず、host runtime に XMLHttpRequest が存在することも要求するため採用しない。

### `fetch()` を page script から呼び出して XMLHttpRequest を構成する

XMLHttpRequest が使用する network request を page realm の別 API に依存させ、state transition と event 配送の途中状態を管理できないため採用しない。

## 参考資料

- [ADR-0047](./0047-window-scripting-separation.md)
- [ADR-0049](./0049-page-realm-execution-contract.md)
- [ADR-0051](./0051-window-polyfill-injection.md)
- [XMLHttpRequest Standard](https://xhr.spec.whatwg.org/)

