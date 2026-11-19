# ADR-0065: Worker global extension

## ステータス

accepted

## コンテキスト

palim は `open()` に指定した Window extension を各 Window realm へ適用し、extension が必要とする host service を同じ browser environment へ提供している。
Dedicated Worker、Shared Worker、および Service Worker は Window とは異なる realm、global object、environment settings、および lifecycle を持つが、選択した extension を worker global へ適用する仕組みを持たない。

Fetch API は Window と各 worker global で提供され、XMLHttpRequest は Window、Dedicated Worker、および Shared Worker で提供される。
一方、Service Worker では XMLHttpRequest を提供せず、Window だけで提供される XMLHttpRequest の member もある。
Window extension をすべての worker global へ適用すると、API が対応しない global にも interface が公開される。
また、host の値を worker global へ直接設定すると、worker realm の interface、Promise、Error、および object identity を維持できない。

このため、Window extension と同じ host service を利用しながら、browser environment の構成が選択した API だけを各 worker global に提供する方法を定める必要がある。

## 決定

- `@palim/polyfills` は Window と worker global へ適用できる extension と、extension が利用する host service の契約を提供する
- Window scripting と `@palim/worker` は `@palim/polyfills` が提供する extension の契約に依存し、`@palim/polyfills` は Window scripting または `@palim/worker` に依存しない
- `palim` は Window、Dedicated Worker、Shared Worker、および Service Worker の構成ごとに適用する extension を選択する
- `palim` は選択した extension と host service を対応する Window scripting または Worker execution environment へ渡す
- Window scripting と `@palim/worker` は、それぞれが所有する realm、environment settings、task execution、および lifecycle を使って extension を適用する
- extension は適用先の realm に interface と state を作成し、別の Window または worker と realm object および state を共有しない
- `@palim/polyfills` の Fetch API は Window、Dedicated Worker、Shared Worker、および Service Worker に対応する
- `@palim/polyfills` の XMLHttpRequest は Window、Dedicated Worker、および Shared Worker に対応し、Service Worker には対応しない
- Window または各 worker global に提供しない API の extension は、その execution environment へ渡さない

## 影響

- Window scripting と `@palim/worker` から `@palim/polyfills` への package dependency が必要になる
- 同じ extension と host service を使用しても、Window と各 worker はそれぞれの realm に属する interface、Promise、Error、および state を持つ
- worker から開始した host 処理の結果は、その worker の task execution と lifecycle に従って worker script へ返る
- Worker の終了後は、完了していない host 処理の結果を worker script へ返さない
- Document を必要とする extension の処理は worker global へ提供しない
- extension の import だけでは既存の Window または worker global を変更せず、browser environment の構成が選択した extension だけを適用する

## 代替案

### `@palim/polyfills` から `@palim/worker` に依存する

Extension の提供側が Worker execution environment の lifecycle と構成方法に依存し、Window extension と異なる依存方向になるため採用しない。

### extension が対応する global を宣言する

API の実装が browser environment の構成を決定し、同じ extension を異なる構成で利用できなくなるため採用しない。

### Window extension をすべての worker global へ適用する

XMLHttpRequest のように Service Worker へ公開されない API と、Document を必要とする処理まで各 worker global へ提供するため採用しない。

### Fetch API を `@palim/worker` に実装する

Window と worker で Headers、Request、Response、body 処理、および host network request の実装が重複するため採用しない。

### host の `fetch()` を worker global へ設定する

Worker realm の interface identity、Promise、Error、FormData、および stream を維持できず、host runtime の実装にも依存するため採用しない。

## 参考資料

- [ADR-0046](./0046-multi-package-capability-boundaries.md)
- [ADR-0049](./0049-page-realm-execution-contract.md)
- [ADR-0051](./0051-window-polyfill-injection.md)
- [ADR-0055](./0055-worker-execution-realm.md)
- [ADR-0060](./0060-service-worker-execution-environment.md)
- [Fetch Standard](https://fetch.spec.whatwg.org/)
- [XMLHttpRequest Standard](https://xhr.spec.whatwg.org/)
- [HTML: Web workers](https://html.spec.whatwg.org/multipage/workers.html)
