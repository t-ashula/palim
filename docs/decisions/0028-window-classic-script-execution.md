# ADR-0028: Window environment settings と classic script の実行境界

## ステータス

accepted

## コンテキスト

ADR-0027 により、`Window` を global object、`WindowProxy` を global this binding とする engine realm を構成できるようになった。
現在の接続試験は engine adapter の source 評価を直接使用しており、HTML Standard の environment settings object、classic script、script の実行前後の処理を持たない。

HTML Standard の script processing model では、classic script は source text だけでなく settings object、base URL、parse error、および error reporting に必要な状態を持つ。
実行時には settings object を current execution へ設定し、実行終了時に状態を復元する必要がある。
最外の script 実行を終えて JavaScript execution context stack が空になった場合は microtask checkpoint が発生する。

engine adapter の汎用的な `evaluate` を Window の実行 API として扱うと、これらの状態と順序を後から追加する場所がなくなる。
`<script>` element の処理へ進む前に、Window 環境へ classic script を作成して実行する内部境界を定める必要がある。

## 決定

- script execution を接続した Window 環境ごとに、一つの Window environment settings object と script runtime を保持する
- Window environment settings object は realm execution context、creation URL、top-level creation URL、API base URL、origin、および responsible event loop への参照を提供する
- active `Document` が持つ URL と origin を、Window environment settings object の API base URL と origin の基準にする
- classic script の作成と実行を分離し、作成時に source text、settings object、base URL、および parse result を保持する
- Window 上で実行する source は engine adapter の汎用 `evaluate` を直接呼ばず、classic script runtime を経由する
- script 実行の前後で current settings object と実行深度を管理し、例外が発生した場合も必ず以前の状態へ戻す
- 最外の classic script 実行が終了した時点で engine の Promise job checkpoint を実行する
- parse error と runtime exception は engine value のまま classic script runtime の結果として保持し、host の例外へ暗黙に変換しない
- Window environment settings、classic script、および runtime は engine 固有型を使用せず、engine adapter の opaque handle を使用する
- parser-only と script execution を接続しない Window の import graph には、この runtime と engine backend を含めない

## 影響

- source の compile、実行、parse error、および runtime exception を別の状態として扱える
- URL と origin を settings object を利用する後続 API で共有できる
- script の実行中に current settings object を参照する callback や API の配置先が定まる
- Promise job は source 評価の途中ではなく、最外の script 実行終了時に処理される
- `<script>` element の処理は、作成済み classic script をこの runtime へ渡す構成にできる
- engine adapter には source の compile と compiled script の実行を分離する操作が必要になる
- Window 環境の生成時に URL と origin の初期値を決める必要がある

## 代替案

### engine adapter の `evaluate` を Window の実行 API として公開する

settings object、base URL、parse error、および実行前後の処理を表現できないため採用しない。

### `<script>` element と同時に classic script runtime を追加する

parser、resource loading、task queue、および script execution の問題を同時に扱うことになり、realm と settings の接続を単独で検証できないため採用しない。

### script 評価のたびに新しい realm を生成する

global state、interface object、DOM platform object、および callback の identity を script 間で維持できないため採用しない。

### source 評価の直後に常に Promise job checkpoint を実行する

script 実行が再入した場合に内側の評価終了時点で Promise job が実行され、最外の script cleanup より前に observable な処理が発生するため採用しない。

## 備考

### 対象外

- `<script>` element の prepare・実行処理
- external script の fetch、MIME type、encoding、および CORS
- module script と import map
- timer、HTML task queue、および event loop の main processing model
- error event、console、および未処理例外の reporting
- CSP、sandbox、および scripting disabled の policy
- navigation に伴う settings object の置き換え

## 参考資料

- [Design log](../design-log/0028-window-classic-script-execution.md)
- [ADR-0026](./0026-javascript-engine-connection.md)
- [ADR-0027](./0027-window-execution-environment.md)
- [WHATWG HTML: Environment settings objects](https://html.spec.whatwg.org/multipage/webappapis.html#environment-settings-objects)
- [WHATWG HTML: Script processing model](https://html.spec.whatwg.org/multipage/webappapis.html#script-processing-model)
- [WHATWG HTML: Calling scripts](https://html.spec.whatwg.org/multipage/webappapis.html#calling-scripts)
- [WHATWG HTML: Script settings for `Window` objects](https://html.spec.whatwg.org/multipage/nav-history-apis.html#script-settings-for-window-objects)
