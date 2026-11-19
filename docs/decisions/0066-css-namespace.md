# ADR-0066: CSS namespace

## ステータス

accepted

## コンテキスト

palim は stylesheet、CSS rule、および style declaration の object を提供し、それぞれを生成した Window realm に対応する interface を公開している。
CSS syntax の解析、CSS property の保持、および style declaration の更新は `@palim/core` が提供し、page script との値の変換と global object への公開は `@palim/scripting` が担っている。

現在の Window realm には `CSS` namespace object が存在しない。
CSSOM、CSS Conditional Rules、CSS Custom Highlight API、および CSS Typed OM などの仕様は、同じ `CSS` namespace にそれぞれの member を追加する。

また、CSS の対応状況を返す処理は、host runtime の機能ではなく、palim が解析して適用できる CSS syntax、property、および value と一致させる必要がある。
このため、Window realm における `CSS` namespace object の所有、複数の CSS 仕様が定める member の合成、および CSS 処理との関係を定める必要がある。

## 決定

- Window realm ごとに単一の Web IDL `CSS` namespace object を提供する
- 複数の CSS 仕様が定める `partial namespace CSS` の member は、同じ Window realm の `CSS` namespace object に追加する
- CSS namespace の member を追加するときに、既存の namespace object と既存 member を置き換えない
- `@palim/core` は CSS namespace の member が利用する CSS syntax、serialization、および support 判定を所有する
- `@palim/scripting` は Window realm の `CSS` namespace object を所有し、`@palim/core` の CSS 処理を page script から呼び出せる member として公開する
- `CSS` namespace object は別の Window realm と object identity および state を共有しない
- 今回は CSSOM の `escape()` と CSS Conditional Rules の `supports()` を `CSS` namespace に追加する
- Worker global には `CSS` namespace を公開しない

## 影響

- 後続の CSS API は既存の `CSS` namespace object にそれぞれの仕様が定める member を追加できる
- `CSS.escape()` は CSSOM の identifier serialization に従う
- `CSS.supports()` は palim が提供する CSS syntax、property、value、および selector の対応状況に基づく
- palim が提供しない CSS 機能と不正な syntax に対して `CSS.supports()` は false を返す
- Highlight API、CSS Properties and Values、CSS Typed OM、CSS Worklet、および CSS Images が `CSS` namespace に追加する member は今回の実装に含めない
- `CSS` namespace の追加だけでは stylesheet、layout、および computed style の対応範囲は増えない

## 代替案

### CSS API ごとに Window global へ別の object を追加する

各仕様が同じ `CSS` namespace に追加する member を単一の object として公開できず、object identity と既存 member を維持できないため採用しない。

### host runtime の `CSS` object を Window global へ設定する

Object が page realm に属さず、host runtime が提供する CSS の対応範囲と palim が解析して適用できる CSS の対応範囲が一致しないため採用しない。

### CSS namespace の処理を `@palim/scripting` だけで提供する

CSS syntax、serialization、および support 判定が stylesheet と style declaration の処理から分離され、同じ CSS 入力に対する結果を共有できないため採用しない。

## 参考資料

- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0041](./0041-web-idl-realm-binding-boundary.md)
- [ADR-0059](./0059-cssom-stylesheet-objects.md)
- [CSS Object Model](https://drafts.csswg.org/cssom/)
- [CSS Conditional Rules Module Level 3](https://drafts.csswg.org/css-conditional-3/)
- [CSS Custom Highlight API Module Level 1](https://drafts.csswg.org/css-highlight-api-1/)
- [CSS Typed OM Level 1](https://drafts.css-houdini.org/css-typed-om-1/)
