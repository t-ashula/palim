# ADR-0026: JavaScript engine との接続境界

## ステータス

accepted

## コンテキスト

palim は parser と DOM を提供しているが、JavaScript realm、global object、および script の compile・evaluate を行う実行環境を持たない。

ADR-0025 により、DOM の interface object、binding、および implementation object を分離する方針を採用した。
JavaScript engine を接続する際は、engine realm に属する interface object を同じ DOM implementation object へ関連付ける必要がある。

palim は parser-only の利用と JavaScript execution を optional capability として分離する方針を持つ。
engine 固有 API を parser、DOM implementation、または HTML element class から直接呼び出すと、この分離を維持できない。

また、JavaScript engine の Promise job と、HTML の task queue は同じ queue ではない。
script の評価と task scheduling を一つの adapter にまとめると、event loop の所有関係が engine backend に依存する。

engine adapter と Web IDL binding の接続は、特定の web global を構築する前に検証する必要がある。
その検証では、engine realm 内の platform object と host 側の DOM interface が同じ DOM implementation を参照することを確認する。

## 決定

- JavaScript engine との接続を薄い internal engine adapter として定義し、parser、DOM implementation、および Web IDL binding から分離する
- engine adapter は realm の生成、engine value と primitive の変換、object と function の生成、property の定義、source の compile・evaluate、JavaScript callback の呼び出し、および realm に属する例外の生成を担当する
- realm、value、object、および callable は palim が定義する opaque handle を介して扱い、engine 固有型を engine adapter の実装外へ公開しない
- DOM interface の定義、operation、および identity は ADR-0025 の binding が担当し、binding は engine adapter を介して realm 内の interface object と platform object を構築する
- HTML の task queue と task source は palim の runtime が管理し、engine adapter は Promise job の checkpoint に必要な操作だけを runtime へ提供する
- engine backend は engine adapter instance の生成時に確定し、一つの adapter instance が生成した realm と opaque handle に別 backend を混在させない
- engine package の import と engine 固有型から opaque handle への変換は engine adapter の実装 module に限定する
- JavaScript execution を提供する module だけが engine adapter interface に依存し、parser-only の import graph には含めない
- engine adapter と Web IDL binding の project integration test は、adapter で test realm を生成し、binding が構築した platform object を test 用 global property として設定して source を評価する
- integration test の host 側 assertion は package が公開する DOM interface を使用し、engine realm 側では binding が構築した interface object と platform object だけを使用する
- test realm を使用した結果は engine adapter と Web IDL binding の project test として扱い、web global の適合結果とは分ける

## 影響

- parser-only の利用に JavaScript engine の初期化コストを持ち込まずに済む
- DOM implementation を engine backend から独立させ、realm ごとの interface object を binding で管理できる
- engine backend を変更するときの修正を engine adapter の実装と backend 固有 test に限定できる
- JavaScript callback と DOM event dispatch の境界を engine adapter に集約できる
- task queue と Promise job の処理順序を palim runtime と engine backend の協調として扱う必要がある
- engine backend の選択、dependency、および security boundary を core package から分離できる
- JavaScript execution を使用する側は engine adapter の実装を用意する必要がある
- 異なる engine adapter が生成した opaque handle を相互に渡せない
- 特定の web global を実装する前に、engine backend ごとの binding、conversion、callback、および object identity を検証できる
- test harness は engine adapter と binding の内部 interface を構成に使用するが、DOM の結果確認には package の公開 interface を使用する

## 代替案

### parser と DOM の module から特定 engine の API を直接使用する

parser-only の import graph が engine backend に依存し、別 backend へ置き換える境界も失われるため採用しない。

### host realm の `eval` または `Function` を使用する

palim が生成する global object と host application の global object を分離できず、realm ごとの binding を構成できないため採用しない。

### test から DOM implementation を直接操作する

engine value の変換、platform object の identity、および engine callback の経路を通らないため採用しない。

## 参考資料

- [Design log](../design-log/0026-javascript-engine-connection.md)
- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [WHATWG HTML: Realms, settings objects, and global objects](https://html.spec.whatwg.org/multipage/webappapis.html#realms-settings-objects-global-objects)
- [WHATWG HTML: Script processing model](https://html.spec.whatwg.org/multipage/webappapis.html#script-processing-model)
- [WHATWG HTML: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [WHATWG Web IDL: ECMAScript binding](https://webidl.spec.whatwg.org/#js-binding)
