# ADR-0034: host execution entry point の整備

## ステータス

accepted

## コンテキスト

現在の `createWindow(options)` は DOM の Window environment を生成する。
この API からは script execution を開始できない。

script execution を持つ `WindowExecutionEnvironment` は内部 class である。
WPT 用の Node runner がこの class を直接使用すると、package 利用者とは異なる実行経路になる。

browser environment の実行には、package から利用できる一つの entry point が必要である。
この entry point を `Window` として公開すると、page realm の Web IDL `Window` と衝突する。

## 決定

- browser environment を返す公開 entry point を一つにする
- entry point は page realm の外側を所有する host object を返す
- host execution entry point を `Window` として公開しない
- page realm の Web IDL `Window` は返された host object から取得する
- Node runner は package root から host execution entry point だけを import する
- engine adapter と Window realm の構築は返された host object に隠す
- WPT の metadata と結果処理は host API に含めない
- parser-only の公開 API は host execution entry point へ統合しない
- `createWindow(options)` と `WindowExecutionEnvironment` を別の公開 entry point として残さない

## 影響

- package の export と型定義に host execution entry point と戻り値の host object を追加する必要がある
- package 利用者と Node runner が同じ構築経路を使用する
- script execution environment の内部構成を package 利用者から変更できなくなる
- page realm の `Window` を host API と区別できる
- `createWindow(options)` を使用する既存 test と文書は移行が必要になる

## 代替案

### host execution entry point を `Window` として公開する

page realm の Web IDL `Window` と host が environment を生成する API を同じ名前で公開することになるため採用しない。

### `WindowExecutionEnvironment` を公開する

内部 layer の構成を package API として固定し、page realm の `Window` より engine 接続を先に公開するため採用しない。

### WPT 専用 factory を公開する

WPT と package 利用者の実行経路が分かれるため採用しない。

### Web IDL `Window` を host から constructible にする

page realm の interface contract と palim 固有の host capability を同じ constructor に持たせることになるため採用しない。

## 参考資料

- [Design log](../design-log/0034-window-host-execution-entry-point.md)
- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0027](./0027-window-execution-environment.md)
- [ADR-0028](./0028-window-classic-script-execution.md)
- [ADR-0031](./0031-document-constructor-boundary.md)
- [ADR-0032](./0032-parser-inserted-external-classic-script.md)
- [ADR-0033](./0033-wptrunner-product-integration.md)
- [WHATWG HTML: The `Window` object](https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-window-object)
- [WHATWG Web IDL: Global interfaces](https://webidl.spec.whatwg.org/#Global)
