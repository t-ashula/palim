# ADR-0058: Trusted Types の policy state と page realm 公開

## ステータス

accepted

## コンテキスト

palim は HTML parsing method、HTML streaming method、および Sanitizer API を提供しているが、Trusted Types の interface、policy、および typed value を提供していない。
Window の page script は `trustedTypes` global を参照できず、HTML parsing sink は文字列と通常の parser options dictionary だけを受け取る。

Trusted Types では、policy factory が policy 名と callback を管理し、policy が生成した typed value を通常の文字列と区別する。
HTML parsing sink は入力と parser options を検査し、必要な場合は default policy を呼び出してから HTML parser へ渡す値を決定する。

policy callback は page realm の JavaScript function であり、callback が投げた例外は page realm の呼び出し元へ返す必要がある。
Trusted Types を特定の HTML parsing method の処理として追加すると、policy state、typed value の識別、および callback の実行が各 method に分散する。

Trusted Types を Window と page realm に追加するには、policy state、page realm object、HTML parsing、および CSP enforcement を所有する package を定める必要がある。

## 決定

- `@palim/window` は Window ごとの Trusted Types policy state、default policy、および CSP enforcement state を所有する
- `@palim/scripting` は `trustedTypes` global と Trusted Types interface を page realm に公開する
- `@palim/scripting` は JavaScript callback の呼び出し、引数と戻り値の変換、および page realm exception の保持を担当する
- Trusted Types の typed value は通常の文字列または dictionary と区別できる state を持ち、page script が同じ property を持つ object で代用できないようにする
- HTML parsing sink の page realm binding は Trusted Types に従って入力と parser options を検査し、検査済みの文字列と通常の parser options を `@palim/core` へ渡す
- `@palim/core` は Trusted Types の policy state、page realm object、および CSP enforcement state を保持しない
- CSP による policy 作成制限、sink enforcement、および violation report は `@palim/window` が所有し、HTML parser と Sanitizer に CSP state を渡さない
- Worker への Trusted Types 公開は Worker execution environment の独立した policy state として扱い、この決定だけでは追加しない

## 影響

- Window ごとに policy 名と default policy が分離される
- page realm ごとに Trusted Types interface と object identity を提供する必要がある
- policy callback の失敗は host exception に変換せず、page realm の completion として扱う必要がある
- HTML parsing method と HTML streaming method は `@palim/core` を呼ぶ前に Trusted Types の入力処理を実行する必要がある
- Trusted Types を要求しない Window では、既存の文字列入力と parser options の処理を維持する必要がある
- Worker へ公開する場合は `@palim/worker` が所有する environment state と `@palim/scripting` の Worker realm 公開を追加する必要がある

## 代替案

### `@palim/core` が policy state と callback を所有する

core が page realm の JavaScript callback、object identity、および CSP enforcement state に依存するため採用しない。

### `@palim/scripting` が policy state を所有する

Window API の behavior と state が JavaScript engine adapter の実装に閉じ、Window environment から管理できないため採用しない。

### HTML parsing sink ごとに Trusted Types を処理する

policy state、default policy、callback の実行、および typed value の識別が各 sink に分散するため採用しない。

## 参考資料

- [ADR-0041](./0041-web-idl-realm-binding-boundary.md)
- [ADR-0047](./0047-window-scripting-separation.md)
- [ADR-0048](./0048-page-realm-exception-boundary.md)
- [ADR-0052](./0052-document-dynamic-markup-insertion.md)
- [Trusted Types](https://w3c.github.io/trusted-types/dist/spec/)
- [HTML parsing and insertion methods](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#html-parsing-methods)
