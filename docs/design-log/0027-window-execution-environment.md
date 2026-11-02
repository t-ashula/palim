# ADR-0027 Design log: Window 環境と JavaScript engine の接続

## Layer 構成

| Layer | 責務 | 依存先 |
| --- | --- | --- |
| DOM implementation | tree、attribute、event、および `Document` の状態 | core DOM |
| Window 環境 | browsing context、`Window`、`WindowProxy`、active `Document` の対応 | DOM implementation |
| host binding | package 利用側へ `Window` と `Document` の interface object を提供する | Window 環境、DOM binding |
| Window realm binding | Window 環境を engine realm の global object と global this binding へ接続する | Window 環境、DOM realm binding、engine adapter |
| engine adapter implementation | opaque handle と backend 固有 object の変換、および realm の生成 | engine backend |

parser-only の module は Window 環境へ依存しない。
Window 環境は engine adapter へ依存せず、Window realm binding が両者を接続する。
engine backend の import は、Window realm binding とその backend implementation を組み立てる entry point に限定する。

## 最初の実装範囲

最初の実装では、次の組だけを一つの Window 環境として生成する。

- 一つの top-level browsing context
- 一つの `WindowProxy`
- 一つの `Window`
- 一つの initial `about:blank` `Document`
- `Window` と `Document` が共有する DOM binding context

active `Document` の切り替えは行わないが、`WindowProxy` は `Window` と別の object として生成する。
`WindowProxy` への property access は現在対応する `Window` へ転送し、後続の navigation 実装が転送先だけを変更できる構成にする。

初期対象の `Window` member は次に限定する。

- `window`
- `self`
- `frames`
- `document`
- `top`
- `parent`
- `frameElement`
- 継承する `EventTarget` の member

`Window` interface object と prototype object は realm ごとに生成する。
Web IDL の global interface member は `Window.prototype` ではなく global object 自身へ配置し、member ごとの property descriptor を維持する。

## Engine adapter の追加操作

Window realm binding は、engine adapter に次の能力を要求する。

- realm の intrinsic を使用して custom global object を生成する
- custom global object と、それとは異なる global this binding を指定して realm を初期化する
- `WindowProxy` として使用する転送 object を生成する
- 転送先の `Window` を設定する

共通の adapter interface では backend 固有の object type を公開しない。
転送 object の内部 method と backend object の対応は adapter implementation に閉じ込める。

## 接続手順

1. Window 環境として browsing context、`WindowProxy`、`Window`、および `Document` の implementation object を生成する
2. engine adapter で `Window` を global object、`WindowProxy` を global this binding とする realm を生成する
3. Window realm binding で `Window` の global interface member と、realm に公開する DOM interface object を配置する
4. active `Document` の implementation object に対応する platform object を `window.document` と `document` から同じ identity で取得できるようにする
5. host binding と engine realm binding を同じ implementation object へ関連付ける
6. engine callback を `Window` の event listener として登録できるようにする

Window 環境の生成だけを行う場合は、手順 2 以降を実行しない。

## Identity と lifecycle

- 一つの Window 環境では browsing context と `WindowProxy` を一対一に対応させる
- `Window` と active `Document` を対応させ、`Window.document` はその `Document` を返す
- browsing context を持つ `Document.defaultView` は対応する `WindowProxy` を返す
- browsing context を持たない `Document.defaultView` は `null` を返す
- host 側と engine realm 側の interface object は共有せず、implementation object を共有する
- 異なる Window 環境の realm、binding context、および platform object は共有しない

## 完了条件

- global script で `globalThis === window`、`window === self`、`window === frames`、`this === window` が成立する
- `window instanceof Window` が成立し、`Window` の global interface member が規定した property descriptor で公開される
- `window.document === document` と `document.defaultView === window` が成立する
- top-level browsing context では `top === window`、`parent === window`、`frameElement === null` が成立する
- engine realm から行った DOM mutation を host 側の公開 interface で観測でき、host 側の変更も engine realm から観測できる
- `Window` に登録した engine callback を同期的な event dispatch から呼び出せる
- 二つの Window 環境の realm、`WindowProxy`、`Window`、`Document` および DOM platform object が共有されない
- browsing context を持たない `Document` の `defaultView` は `null` のままである
- parser-only と JavaScript engine を接続しない Window 環境の test は engine package を読み込まずに実行できる

## 参考資料

- [ADR-0027](../decisions/0027-window-execution-environment.md)
- [ADR-0026 Design log](./0026-javascript-engine-connection.md)
- [WHATWG HTML: The `Window` object](https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-window-object)
- [WHATWG HTML: The `WindowProxy` exotic object](https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-windowproxy-exotic-object)
- [WHATWG HTML: Browsing contexts](https://html.spec.whatwg.org/multipage/document-sequences.html#browsing-context)
- [WHATWG Web IDL: Global interfaces](https://webidl.spec.whatwg.org/#Global)
