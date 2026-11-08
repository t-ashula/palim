# ADR-0047 Design log: Window と scripting のパッケージ分離

## 現在の構成

`packages/palim/src/open.ts` は initial Document を取得した後、常に `WindowExecutionEnvironment` を生成する。
`WindowExecutionEnvironment` は constructor 内で `Engine262Adapter` を生成するため、`open()` から scripting と engine262 を除外できない。

`WindowExecutionEnvironment` は次の処理を一つの class で行っている。

- Window の生成
- HTML parsing
- load event の dispatch
- script 以外の subresource の取得
- inline script の評価
- external script の取得と評価
- dynamic script の処理
- script の結果と失敗の記録

Window 自体は `packages/palim/src/window.ts` だけで生成でき、engine262 を使用しない。
この分離を package 構成にも反映する。

HTML parser は document parsing では明示的な `ParserScriptingMode` を受け取れるが、streaming fragment parsing では `Document.defaultView` から mode を推測している。
Document が scripting mode を保持し、すべての parsing 経路がその値を使用する形へ変更する。

## 目標の package graph

`A -> B` は A が B を dependency として使用することを表す。

```text
@palim/window    -> @palim/core
@palim/scripting -> @palim/core, @palim/window
@palim/engine262 -> @palim/scripting
palim            -> @palim/core, @palim/window,
                    @palim/scripting, @palim/engine262
```

循環 dependency は作らない。

## package ごとの配置

### `@palim/window`

現在の次の module を基礎にする。

- `window.ts`
- `window-named-properties.ts`
- `html-byte-input.ts`
- `open.ts` の input loading、decode、content type 判定
- `window-javascript.ts` の Window 生成、document loading、load event、および script 以外の resource 処理

`Resource`、`ResourceLoader`、`OpenHTMLOptions`、`OpenResult`、`OpenOptions`、`Window`、および document loading に必要な型をこの package に置く。

package root から `open()` を export する。
`open()` は scripting disabled で動作し、`{ scripting: "enabled" }` が指定された場合は入力の取得を始める前に `TypeError` で reject する。

### `@palim/scripting`

現在の次の処理を移す。

- `javascript-engine/adapter.ts`
- DOM、URL、Window、および FormData の realm binding
- classic script の生成と評価
- parser-inserted inline script
- parser-inserted external script
- dynamic script
- script の decode
- script evaluation error の Window への報告

`window-javascript.ts` にある script 判定、script result、および script resource の処理もこの package に移す。

### `@palim/engine262`

`javascript-engine/engine262-adapter.ts` だけを engine262 固有 package に移す。
engine262 の dependency 宣言も `palim` からこの package へ移す。

### `palim`

full package には次だけを残す。

- `@palim/core` の DOMParser と既存 interface の再 export
- `@palim/window` が定義する `OpenHTMLOptions`、`OpenResult`、および `OpenOptions` の再 export
- `@palim/window` と同じ型を持ち、scripting の有効化に対応する `open()`
- scripting enabled の場合に `@palim/engine262` の adapter と `@palim/scripting` の script 処理を生成する処理

## `open()` の型

`@palim/window` と `palim` は同じ `OpenOptions` と関数シグネチャを export する。
capability package の import による module augmentation、overload の追加、および条件付き export は使用しない。

```ts
export interface OpenHTMLOptions {
  readonly html: string;
  readonly baseURL?: string;
}

export interface OpenResult {
  readonly window: Window;
}

export interface OpenOptions {
  readonly scripting?: "enabled";
}

export function open(
  input: string | OpenHTMLOptions,
  options?: OpenOptions,
): Promise<OpenResult>;
```

`scripting` の省略時は disabled とする。
`"disabled"` は指定値に含めない。省略が disabled を表すためである。

URL string と `{ html, baseURL }` の input は維持する。
第2引数を追加するため、既存の呼び出しは型エラーにならず、script を実行しない挙動へ変わる。

## import 順序からの独立

`@palim/window` と `palim` は、それぞれ module の初期化時に自身の `open()` を生成し、その設定を後から変更しない。

- `@palim/window.open()` は、ほかの capability package を先または後に import しても scripting enabled を拒否する
- `palim.open()` は、ほかの package が先に import されていても `{ scripting: "enabled" }` を処理する
- `@palim/scripting` と `@palim/engine262` は registry、global object、既存 function、prototype、および instance を変更しない
- `palim` は `@palim/window` が export した `open()` を変更せず、同じ `createOpen()` から別の function を生成する

同じ process で両方の package を import しても、それぞれの `open()` の挙動は import 前後で変化しない。

## Document の scripting mode

`DocumentImplementation` に次の状態を追加する。

```ts
scriptingMode: ParserScriptingMode = "disabled";
```

Document を生成する処理は、parsing より前に mode を決める。

| 生成経路 | mode |
| --- | --- |
| DOMParser | `disabled` |
| `@palim/window.open()` | `disabled` |
| `@palim/window.open(..., { scripting: "enabled" })` | error |
| `palim.open()` | `disabled` |
| `palim.open(..., { scripting: "enabled" })` | `enabled` |

次の処理は `DocumentImplementation.scriptingMode` を読む。

- document parsing
- fragment parsing
- streaming fragment parsing
- `<noscript>` token の処理
- parser-inserted script の実行判定
- dynamic script の実行判定
- external script resource の取得判定

`defaultView` は Window の有無だけを表す。
scripting mode の判定には使用しない。

## Window document loading

`@palim/window` の internal subpath に engine 非依存の document loader と `createOpen()` を置く。
`createOpen()` は scripting factory を optional な引数として受け取り、共通の `open()` 型を返す。

- `@palim/window` は scripting factory なしで `createOpen()` を呼ぶ
- `palim` は `@palim/scripting` と `@palim/engine262` を遅延生成する scripting factory を渡す

生成された `open()` は次の順序で処理する。

1. `{ scripting: "enabled" }` の指定と scripting factory の有無を検証する
2. enabled が指定され、factory がなければ `TypeError` で reject する
3. URL input なら initial response を取得する
4. content type と encoding を決める
5. Window と active Document を生成する
6. Document に scripting mode を設定する
7. scripting enabled なら script 処理を用意する
8. HTML または XML を parse する
9. resource を処理する
10. pending resource を待つ
11. load event を dispatch する

Window と Document の生成時点では parsing を開始しない。
これにより full package は scripting mode と script 処理を parsing より前に確定できる。

## scripting enabled の処理

`palim.open(input, { scripting: "enabled" })` は次の順序で処理する。

1. `@palim/window` の document loader で input を取得し、Window と active Document を生成する
2. Document の mode を `enabled` にするが、parsing はまだ開始しない
3. `@palim/engine262` から adapter を生成する
4. `@palim/scripting` で Window realm と script processor を生成する
5. dynamic script 用の document callback を設定する
6. HTML parser に parser-inserted script を処理する関数を渡す
7. parsing と pending resource の完了後に load event を dispatch する

realm は HTML parsing より前に生成する。
parser が生成する object、custom element reaction、event callback、および inline script が同じ page realm を使用するためである。

## scripting disabled の処理

`@palim/window.open(input)` と `palim.open(input)` は次を保証する。

- engine adapter を生成しない
- realm を生成しない
- inline script を評価しない
- external script resource を取得しない
- dynamic script を評価しない
- Document の mode は `disabled` のままにする
- `<noscript>` は scripting disabled として parse する

full package の `open.ts` は scripting enabled の分岐内で `@palim/scripting` と `@palim/engine262` を dynamic import する。
これにより disabled の呼び出しでは engine262 module を評価しない。

## internal API

`@palim/window` の internal subpath は、full package と `@palim/scripting` に次を提供する。

- 共通の `open()` を生成する `createOpen()`
- initial input の取得と decode
- Window と active Document の生成
- HTML/XML document loader
- `ResourceLoader`
- pending resource の待機
- load event の dispatch

HTML document loader は parser-inserted script と element insertion の処理関数を引数として受け取れるようにする。
引数を省略した場合は script を処理しない。

`createOpen()` に scripting factory を渡さなくても、返される関数の `OpenOptions` は変わらない。
factory の有無は `{ scripting: "enabled" }` を処理できるかどうかだけを決める。
生成後に factory を追加、削除、または置換する API は提供しない。

`@palim/scripting` の internal subpath は、engine adapter と Window document loader を引数に取り、次を返す factory を提供する。

- page realm
- parser-inserted script を処理する関数
- dynamic script を処理する document callback
- script execution result

一般利用者向け package root から engine adapter、realm binding、document loader、および script processor を export しない。

## 移行順序

1. `DocumentImplementation` に `scriptingMode` を追加し、parser が `defaultView` を参照しないようにする
2. scripting disabled と enabled の parser regression test を追加する
3. engine 非依存の Window document loader を `WindowExecutionEnvironment` から抽出する
4. `@palim/window` package を作り、共通の `open()` 型、`createOpen()`、Window、および document loading の処理を移す
5. engine adapter interface、realm binding、および script 処理を `@palim/scripting` へ移す
6. `Engine262Adapter` と dependency を `@palim/engine262` へ移す
7. `@palim/window` の `open()` を scripting factory なしで生成し、enabled 指定時の error を追加する
8. `palim` の `open()` を scripting factory ありで生成し、option なしを disabled に変更する
9. `{ scripting: "enabled" }` の場合だけ scripting package と engine262 package を読み込む
10. WPT runner を `{ scripting: "enabled" }` へ変更する
11. package artifact と import graph の test を追加する

各段階で `npm run check` を成功させる。

## test 方針

### `@palim/window`

- package import が engine262 を読み込まない
- `palim` と同じ `OpenOptions` と関数シグネチャを export する
- option なしでは script を実行しない
- `{ scripting: "enabled" }` では入力を取得せず `TypeError` で reject する
- document loader が script 処理の有無を引数で受け取る
- Window と Document を生成した時点では parsing を開始しない
- Window、Document、Location、および `defaultView` の identity を維持する
- load event を一度 dispatch する

### `palim`

- option なしでは script を実行しない
- `{ scripting: "enabled" }` で inline script を実行する
- `{ scripting: "enabled" }` で parser-inserted external script と dynamic script を実行する
- disabled の呼び出しでは engine262 module を読み込まない
- enabled の呼び出しでは page realm の Window、Document、および DOM interface identity を維持する

### package artifact

- `@palim/window` の配布物と dependency に realm binding と engine262 が含まれない
- `@palim/scripting` の配布物と dependency に engine262 が含まれない
- `@palim/engine262` だけが engine262 を dependency に持つ
- `palim` の配布物に下位 package の実装 file が重複しない
- `@palim/core` の import graph と export を変更しない

### import 順序

- `@palim/window`、`@palim/scripting` の順で import しても `@palim/window.open(..., { scripting: "enabled" })` は reject する
- `@palim/scripting`、`@palim/window` の順で import しても同じ結果になる
- `palim` の前後に capability package を import しても `palim.open()` の disabled と enabled の挙動は変わらない
- 同じ process で `@palim/window.open()` と `palim.open()` を呼び分けても、一方の呼び出しが他方の挙動を変更しない

## 完了条件

- `palim.open()` が標準では script を実行しない
- `palim.open(..., { scripting: "enabled" })` だけが page script を実行する
- `@palim/window` と `palim` が同じ `OpenOptions` と関数シグネチャを export する
- `@palim/window.open(..., { scripting: "enabled" })` が `TypeError` で reject する
- capability package の import 前後と import 順序によって、それぞれの `open()` の挙動が変わらない
- Document の scripting mode が `defaultView` と独立している
- scripting disabled では script resource を取得しない
- `WindowExecutionEnvironment` が `Engine262Adapter` を直接生成しない
- engine262 dependency が `@palim/engine262` だけに存在する
- WPT runner が scripting enabled を明示する
- package artifact、型定義、project test、および WPT 実行経路が新しい package graph を使用する

## 参考資料

- [ADR-0047](../decisions/0047-window-scripting-separation.md)
- [ADR-0026](../decisions/0026-javascript-engine-connection.md)
- [ADR-0027](../decisions/0027-window-execution-environment.md)
- [ADR-0028](../decisions/0028-window-classic-script-execution.md)
- [ADR-0030](../decisions/0030-script-element-classic-script-execution.md)
- [ADR-0032](../decisions/0032-parser-inserted-external-classic-script.md)
- [ADR-0034](../decisions/0034-window-host-execution-entry-point.md)
- [ADR-0046](../decisions/0046-multi-package-capability-boundaries.md)
