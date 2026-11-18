# ADR-0060: Service Worker execution environment

## ステータス

accepted

## コンテキスト

palim は classic Dedicated Worker と classic Shared Worker の execution environment を提供しているが、Service Worker の登録、global object、lifecycle、および Window client との通信を提供していない。
Window の page script は `navigator.serviceWorker` を参照できず、Service Worker の登録、検索、および message の送受信を行えない。

Service Worker は origin と scope に関連付いた登録を持ち、Window から取得した script を Window とは異なる global object と environment settings で実行する。
登録された worker は install と activate を経て active worker になり、Window client からの message を処理する。

Service Worker を Window に追加するには、Window から参照する登録状態、worker script の実行、lifecycle、resource loading、および Window client との message 配送を所有する package を定める必要がある。

## 決定

- HTML Standard と Service Workers Standard に従い、classic Service Worker を提供する
- `@palim/window` は origin に関連付く Service Worker 登録、scope、active worker、および Window client の状態を所有する
- `@palim/window` は `Navigator` と `ServiceWorkerContainer` の API behavior を提供する
- `@palim/worker` は Service Worker global、environment settings、classic script 実行、install、activate、message event、および lifecycle を所有する
- `@palim/scripting` は Window realm と Service Worker realm へ interface を公開し、JavaScript callback の呼び出し、値の変換、および page/worker realm exception の処理を担当する
- `palim` は resource loading、engine adapter、Window client、および Service Worker execution environment を組み立てる
- Service Worker 登録は origin と scope で検索し、同じ登録を参照する Window では object identity を維持する
- Window と Service Worker の message は Web Messaging と structured data の処理を使用する
- WPT runner に Service Worker 専用の実行経路を追加せず、公開 Window API から登録して実行する
- fetch event による resource interception、module Service Worker、push、sync、notification、および persistent storage はこの決定では追加しない

## 影響

- Window は `navigator` と `navigator.serviceWorker` を公開する
- 同じ origin の複数 Window が Service Worker 登録を共有する
- Service Worker は Window、Document、および Dedicated/Shared Worker とは異なる global と lifecycle を持つ
- worker script の取得失敗、evaluation 失敗、および lifecycle callback の失敗を登録状態と呼び出し元の Promise へ反映する必要がある
- Window を閉じても origin に関連付く登録が直ちに失われない状態管理が必要になる
- Service Worker と client 間の message 配送をそれぞれの event loop へ接続する必要がある
- resource interception を追加する場合は、登録と lifecycle とは別に resource loading との関係を決定する必要がある

## 代替案

### WPT wrapper だけを直接実行する

Window の登録 API、Service Worker global、および message 配送を通らず、製品が提供しない test 専用経路になるため採用しない。

### Service Worker を Window realm で実行する

Window と Service Worker の global、environment settings、lifecycle、および exception 処理を分離できないため採用しない。

### 登録状態を `@palim/worker` だけで管理する

Window が所有する `Navigator` API と Window client から、origin と scope に関連付く登録を一貫して参照できないため採用しない。

### Service Worker 全体を `@palim/window` に実装する

worker global、script 実行、event loop、および messaging が既存の Worker execution environment と重複するため採用しない。

## 参考資料

- [ADR-0027](./0027-window-execution-environment.md)
- [ADR-0047](./0047-window-scripting-separation.md)
- [ADR-0049](./0049-page-realm-execution-contract.md)
- [ADR-0055](./0055-worker-execution-realm.md)
- [Service Workers](https://w3c.github.io/ServiceWorker/)
- [HTML: Web workers](https://html.spec.whatwg.org/multipage/workers.html)
- [HTML: Navigator](https://html.spec.whatwg.org/multipage/system-state.html#the-navigator-object)
- [HTML: Web messaging](https://html.spec.whatwg.org/multipage/web-messaging.html)
