# ADR-0055: Worker execution environment

## ステータス

accepted

## コンテキスト

WPT report では、`Worker` または `SharedWorker` が存在しないため、worker 内で対象 API を検証する test が実行前に停止している。
WPT の worker 用 test は Window から worker を生成し、worker script で test を実行して結果を Window へ返す。
constructor だけを Window に追加しても、worker global、script の取得と実行、および Window との messaging がなければこれらの test は実行できない。

現在の scripting capability は Window environment settings と Window realm での classic script 実行を扱う。
Worker は Window とは異なる global object と environment settings を持ち、Window や Document を公開しない。
また、Dedicated Worker と Shared Worker では owner、接続、および lifecycle が異なる。

Window の script 実行を worker に流用したり、host の Worker を直接公開したりせず、Worker の仕様に対応する execution environment と package 間の境界を定める必要がある。

## 決定

### 仕様

- HTML Standard の classic Dedicated Worker と classic Shared Worker を実装する
- Worker ごとに Window とは別の global object、realm、environment settings、および event loop を持つ
- worker global に公開する interface、script の取得と実行、`importScripts()`、messaging、および lifecycle は HTML Standard に従う
- Window と worker の messaging は Web Messaging および structured data の仕様に従う
- module worker と Service Worker はこの決定に含めない

### package 分割方針

- `@palim/worker`
  - Worker execution environment、classic worker script の実行、messaging、および lifecycle を提供する
  - JavaScript engine backend を直接選択せず、`@palim/scripting` の engine adapter、realm binding、および execution runtime を使用する
- `@palim/scripting`
  - Window と Worker に共通する engine adapter、realm binding、execution runtime、および Window へ scripting capability を追加するための注入口を提供する
  - JavaScript engine adapter は worker ごとの agent と realm を生成する操作を提供し、Worker 固有の lifecycle と resource loading を持たない
- `@palim/window`
  - worker script の取得を既存の resource loading に接続する
- `palim`
  - engine adapter の生成、resource loading、および `@palim/worker` の capability を Window scripting environment へ接続する
- Window extension を worker global へ暗黙に適用しない
- WPT runner に worker 専用の実行経路を追加せず、公開 `open()` から生成される Window と Worker を使用する

### 検証

- project test で Window と worker の global、realm、environment settings、および job queue が分離されることを確認する
- project test で classic worker script の取得と実行、Dedicated Worker と Shared Worker の messaging、および lifecycle を確認する
- project test で worker 内の例外が page realm の実行と同じ completion 契約に従い、host の call stack へ返らないことを確認する
- `/workers/` の WPT で worker global、`importScripts()`、messaging、および lifecycle を確認する
- 現在 `Worker is not defined` または `SharedWorker is not defined` で停止している WPT を再実行し、worker 内の test result が WPT harness へ返ることを確認する
- ADR-0054 に従って WPT report を更新し、worker の導入後に残る対象 API の failure を分けて記録する

## 影響

- `@palim/worker` package が Worker の execution environment と messaging state を持つ
- `@palim/scripting` は Worker 固有の lifecycle と resource loading に依存しない
- JavaScript engine backend は複数の agent、realm、および job queue を扱う
- resource loading は Document と script element に加えて worker script の取得にも使用される
- Dedicated Worker と Shared Worker の messaging state と lifecycle を管理する必要がある
- worker を前提とする WPT が対象 API の検証まで進む
- module worker と Service Worker は別の決定と実装が必要になる

## 代替案

### host の Worker を直接公開する

page realm の interface、resource loading、exception、および lifecycle が host 実装に依存するため採用しない。

### Window realm で worker script を実行する

Window と Worker の global、environment settings、および agent を分離できないため採用しない。

### WPT runner に worker 用の実行経路を追加する

製品の Worker API を経由せず、WPT のためだけの実行環境になるため採用しない。

### Worker を `@palim/scripting` に含める

Window scripting と Worker execution environment の lifecycle、resource loading、および messaging state が同じ package に集まり、個別に構成・検証できないため採用しない。

## 参考資料

- [ADR-0027](./0027-window-execution-environment.md)
- [ADR-0028](./0028-window-classic-script-execution.md)
- [ADR-0035](./0035-wpt-document-resource-loading.md)
- [ADR-0047](./0047-window-scripting-separation.md)
- [ADR-0049](./0049-page-realm-execution-contract.md)
- [ADR-0054](./0054-wpt-spec-conformance-plan.md)
- [WHATWG HTML: Web workers](https://html.spec.whatwg.org/multipage/workers.html)
- [WHATWG HTML: Web messaging](https://html.spec.whatwg.org/multipage/web-messaging.html)
- [WHATWG HTML: Safe passing of structured data](https://html.spec.whatwg.org/multipage/structured-data.html#safe-passing-of-structured-data)
- [Web Platform Tests: JavaScript tests in multiple globals](https://web-platform-tests.org/writing-tests/testharness.html#tests-for-other-or-multiple-globals-any-js)
