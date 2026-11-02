# ADR-0027: Window 環境と JavaScript engine の接続

## ステータス

accepted

## コンテキスト

ADR-0026 で導入した engine adapter と DOM realm binding は、通常の ECMAScript realm に test 用 global property を追加して接続を検証している。
この realm の global object は `Window` ではなく、global this binding も `WindowProxy` ではないため、`window`、`document`、`Document.defaultView` を通る browser script の実行環境にはならない。

HTML Standard では `Window` が realm の global object であり、対応する browsing context の `WindowProxy` が global this binding になる。
`Window` の `window`、`self`、`frames` はこの `WindowProxy` を返し、browsing context を持つ `Document` の `defaultView` も同じ object を返す。
また、Web IDL の global interface は、通常の interface と property の配置が異なる。

一方、palim は `Window` を parser-only の利用および JavaScript execution から分離可能な capability とする。
`Window` の状態管理を特定 engine の realm 生成処理に含めると、script を実行しない `Window` まで engine backend に依存する。

## 決定

- 一つの top-level browsing context、`Window`、`WindowProxy`、および active `Document` の対応を `Window` 環境として管理する
- `Window` 環境の状態と生成処理は engine backend に依存させない
- browsing context を持たない既存の `Document` はそのまま扱い、`defaultView` は `null` とする
- JavaScript execution を追加する場合は、`Window` 環境と engine adapter を受け取る Window realm binding を別 module に置く
- Window realm binding は `Window` を realm の global object、対応する `WindowProxy` を global this binding として realm を生成する
- engine realm 内の `Window`、`Document` およびその他の DOM platform object は、host 側の interface object と同じ implementation object を参照する
- `Window` interface の member は Web IDL の global interface binding として global object 自身に配置する
- `WindowProxy` の identity は `Window` 環境の生存中は維持する
- parser-only、script execution を持たない `Window`、および script execution を接続した `Window` の import graph を分け、JavaScript engine は最後の構成だけで読み込む

## 影響

- `Window` を JavaScript engine なしでも生成でき、必要な場合だけ script execution を接続できる
- test 用 global property ではなく、browser script と同じ global object と global this binding を使って DOM binding を検証できる
- host 側と engine realm 側で interface object は異なるが、DOM の状態と変更結果は共有される
- engine adapter は通常の realm に加えて、global object と global this binding を分けて生成できる必要がある
- `WindowProxy` の転送処理は、後から navigation を追加しても参照元の identity を変更しない境界になる
- Web IDL global interface の property descriptor と prototype chain を通常の DOM interface とは別に扱う必要がある

## 代替案

### `Window` の生成を engine adapter に含める

script を実行しない `Window` まで特定 engine の realm と value model に依存するため採用しない。

### 通常の realm の global property に `window` と `document` を追加する

global object、global this binding、Web IDL global interface、および `WindowProxy` の identity を再現できないため採用しない。

### `Window` と `WindowProxy` を同じ object として扱う

navigation を追加するときに、参照元が保持する `WindowProxy` の identity を維持したまま転送先の `Window` を変更できないため採用しない。

### navigation と nested browsing context まで同時に実装する

engine と `Window` の最小接続に不要な lifecycle、origin、および session history の設計が先行するため採用しない。

## 備考

### 対象外

- navigation、session history、および active `Document` の切り替え
- iframe と nested browsing context
- origin、cross-origin access、および `WindowProxy` の security check
- named access と indexed access
- `Location`、`History`、`Navigator` など、接続確認に不要な `Window` member
- timer、task queue、event loop、および `<script>` element の処理
- resource loading

これらを追加するときは、`WindowProxy` の identity とこの ADR の依存方向を維持したまま別の決定として扱う。

## 参考資料

- [Design log](../design-log/0027-window-execution-environment.md)
- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0026](./0026-javascript-engine-connection.md)
- [WHATWG HTML: The `Window` object](https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-window-object)
- [WHATWG HTML: The `WindowProxy` exotic object](https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-windowproxy-exotic-object)
- [WHATWG HTML: Browsing contexts](https://html.spec.whatwg.org/multipage/document-sequences.html#browsing-context)
- [WHATWG HTML: Creating a new browsing context and document](https://html.spec.whatwg.org/multipage/document-sequences.html#creating-a-new-browsing-context)
- [WHATWG Web IDL: Global interfaces](https://webidl.spec.whatwg.org/#Global)
