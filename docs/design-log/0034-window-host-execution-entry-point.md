# ADR-0034 Design log: open overload を host execution entry point とする

## 現在の構成

`createWindow(options)` は browsing context と DOM の Window を生成する。
JavaScript engine は読み込まず、classic script の runtime も持たない。

`WindowExecutionEnvironment` は DOM の Window に engine realm と classic script runtime を接続する。

後者だけが browser script を実行できるが、package の公開 entry point ではない。

## Host API

`open` は page realm の外側を表す host object を非同期に生成する。
URL loading を伴わない場合も、同じ完了契約を保つため Promise を返す。

一回の呼び出しは、独立した Window environment と JavaScript realm を生成する。
異なる呼び出しの DOM state と script state は共有しない。

`options` は browser environment の host capability を受け取る。
初期 URL と resource loader はこの境界から渡す。
engine backend の object と WPT 固有の object は受け取らない。

`open` は既存の Window environment を生成した後に script execution を接続する。
利用者は `WindowExecutionEnvironment` を直接生成しない。

## Input

`open(url)` は URL が示す resource を initial document として読み込む。
WPT の Node runner はこの形式を使用する。

`open({ html, baseURL })` は `html` を initial document の source として使用する。
`baseURL` は相対 URL の解決基準であり、initial document の取得には使用しない。

HTML 入力用の options は `html` と `baseURL` を持つ専用の型にする。
任意の property を許す `Record` は使用しない。

どちらの形式も同じ host object を返す。
URL 用と HTML 用に別の entry point は設けない。

## Page realm との分離

page script の `window` は、ADR-0027 で定めた `WindowProxy` である。
page script の `Window` は、その realm に置かれる Web IDL interface object である。

外側の host object は、この二つを生成する側の API である。
page realm の `Window` を host execution entry point として公開しない。

## Package export

package root は `open` の overload を export する。
Node runner は `open` だけを import し、`src/**` を参照しない。

現在の `createWindow(options)` は公開 export から外す。
現在の `WindowExecutionEnvironment` は内部 class のまま維持する。
DOM implementation や engine adapter の class も公開しない。

parser-only の `DOMParser` と parsing API は、JavaScript engine を必要としないため変更しない。

## Node runner からの利用

Node runner は product adapter から test HTML の URL を受け取る。
Node runner は `open(url)` を呼び出し、test ごとに新しい environment を生成する。

test URL の実行は、この environment を通る。
Node runner は内部 parser や classic script runtime を直接呼ばない。

実行結果は product adapter を経由して wptrunner へ返す。
その処理を host object の公開 contract へ追加しない。

## Project test

- package root の `open(url)` から外側の object を生成できることを確認する
- package root の `open({ html, baseURL })` から同じ型の object を生成できることを確認する
- host から document state を観測できることを確認する
- page script が同じ environment の DOM を変更できることを確認する
- 二つの呼び出しが realm と DOM state を共有しないことを確認する
- page realm の `window` と `Window` が ADR-0027 の identity を維持することを確認する
- parser-only の import graph が engine backend を読み込まないことを確認する
- Node runner が package root 以外の palim module を import しないことを確認する

## 完了条件

- script execution を持つ browser environment を `open` のどちらの overload からも生成できる
- package 利用者と Node runner が同じ entry point を使用する
- `createWindow(options)` が別の公開 entry point として残らない
- engine adapter と Window execution の内部 class が package API に現れない
- page realm の Web IDL `Window` が host API から分離される
- WPT 固有の設定と結果型が host object に入らない
- parser-only の公開 API と import boundary が維持される

## 参考資料

- [ADR-0034](../decisions/0034-window-host-execution-entry-point.md)
- [ADR-0027 Design log](./0027-window-execution-environment.md)
- [ADR-0028 Design log](./0028-window-classic-script-execution.md)
- [ADR-0032 Design log](./0032-parser-inserted-external-classic-script.md)
- [ADR-0033 Design log](./0033-wptrunner-product-integration.md)
