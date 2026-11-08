# ADR-0047: Window と scripting のパッケージ分離

## ステータス

accepted

## コンテキスト

ADR-0027 は、Window environment を JavaScript engine なしで生成できる構成を定めている。
ADR-0046 は、Window、scripting、および JavaScript engine backend を `@palim/core` から分離する方針を定めている。

現在の `open()` は Window の生成と scripting の有効化を一体として扱っている。
このため、Window と Document だけを必要とする利用でも JavaScript engine が必須になり、HTML または URL を開くだけで page script が実行される。

Window の有無と scripting の有効・無効は独立して選べる必要がある。
scripting を optional capability とし、page script の実行を利用者が明示的に選ぶ構成を定める。

## 決定

### package 構成

- `@palim/window` は、scripting を伴わない Window environment を提供する
- `@palim/scripting` は、特定の JavaScript engine に依存しない scripting capability を提供する
- `@palim/engine262` は、engine262 による JavaScript engine backend を提供する
- `palim` は、これらの capability を含む full package とする

### `open()`

- `open()` で scripting を使うときは `{ scripting: "enabled" }` の明示を要求する
- 未指定時は disabled として扱う
- scripting disabled では script を評価せず、external script resource を取得しない
- `@palim/window` の `open()` では `{ scripting: "enabled" }` をエラーとし例外を投げる

### scripting mode

- scripting mode は Window の有無とは独立した Document の状態とする
- scripting mode の標準値は disabled とする
- parser は Window の有無から scripting mode を推測しない
- 一つの Document に対する parsing と script 処理は同じ scripting mode に従う

## 影響

- Window を engine262 なしで利用できる
- `open()` は明示されない page script を実行しなくなる
- `palim` の現在の `open()` と比較して破壊的な挙動変更になる
- WPT runner と page script を必要とする test は `{ scripting: "enabled" }` を明示する必要がある
- scripting disabled の parsing で `<noscript>` が Window の有無に影響されなくなる
- package と配布 artifact の検証対象が増える

## 代替案

### `palim` の `open()` で scripting enabled を標準動作にする

HTML または URL を開くだけで page script が実行され、scripting を optional capability とする package 構成とも一致しないため採用しない。

### Window が存在するときは scripting enabled とみなす

script を実行しない Window を表現できず、`defaultView` と parser の scripting mode が不要に連動するため採用しない。

### `@palim/window` に scripting option を追加する

常に scripting disabled であるという package の役割が曖昧になるため採用しない。

### package を分けずに `palim` 内の条件分岐だけで切り替える

Window だけを必要とする利用者の dependency と配布物から scripting と engine262 を除外できないため採用しない。

## 参考資料

- [Design log](../design-log/0047-window-scripting-separation.md)
- [ADR-0026](./0026-javascript-engine-connection.md)
- [ADR-0027](./0027-window-execution-environment.md)
- [ADR-0028](./0028-window-classic-script-execution.md)
- [ADR-0030](./0030-script-element-classic-script-execution.md)
- [ADR-0032](./0032-parser-inserted-external-classic-script.md)
- [ADR-0034](./0034-window-host-execution-entry-point.md)
- [ADR-0046](./0046-multi-package-capability-boundaries.md)
