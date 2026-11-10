# ADR-0049: page realm の実行境界と completion 契約

## ステータス

accepted

## コンテキスト

ADR-0048 は、page realm の例外値と実行 context を保持し、host JavaScript の例外を transport に使用せず、realm 内の exception reporting を終えてから host へ観測情報を渡す方針を定めた。

この方針を満たすには、callback の呼び出しだけでなく、page code を実行し得る property 操作、型変換、および非同期処理にも同じ completion 契約が必要である。
また、script、callback、および job の実行前後に必要な realm と environment settings の管理、例外時の処理、および microtask checkpoint を調停する責務を明確にする必要がある。

throw された値は primitive または別 realm で生成された object の場合もある。
値の作成元 realm から callback の associated realm、実行 settings、または報告先 global を推測することはできない。

本 ADR は ADR-0048 を補足し、ADR-0026 の engine adapter、ADR-0041 の standard algorithm と binding の分離、および ADR-0047 の package 境界に沿って実行契約を具体化する。

## 決定

### 実行境界

- `@palim/scripting` の runtime は、page script、callback、および job の実行に必要な realm と settings の準備・復元、completion の受け渡し、例外処理、および checkpoint の調停を所有する
- DOM と Window の standard algorithm は engine 非依存層に維持し、callback port を介して runtime と接続する。engine value の解釈と保持、および realm 固有の処理は binding と runtime が担当する
- page script に由来するすべての例外は、元の値と実行 context を保持し、standard algorithm が指定する再送出、報告、または Promise rejection として page realm 内で処理する
- callback の associated realm、その relevant settings、登録時の callback context、および algorithm が指定する報告先を区別して保持する。throw value の作成元 realm や callback の登録先 object から報告先を推測しない
- 準備・復元、再送出、報告、および checkpoint の順序は、呼び出す standard algorithm に従う。callback の種類ごとに独立した実行終了処理を作らない

### adapter の completion 契約

- engine adapter は、page code を実行し得る操作と、page に公開する規定例外を生じ得る操作について、normal と throw を区別した completion を返す
- この契約には script の compile・evaluate、call・construct、accessor と Proxy trap を通る property 操作、型変換、および iterator の操作を含める
- abrupt completion は元の任意の engine value を保持する。message 化、別の例外の生成、専用の host `Error` subclass、または host の throw によって completion を運ばない
- realm の初期化でのみ使用する内部操作と、page code の実行中にも使用する操作を区別する。内部操作の失敗を host failure として扱えることを、page に影響される操作へ一般化しない
- Web IDL が新たに生成する標準例外は、その operation の実行時の current realm に生成する。既に throw された値を再送出する場合は、その identity を維持する
- adapter の誤用、invariant 違反、および予期しない host exception は host failure として扱い、page の通常例外へ変換しない

### 非同期実行と例外報告

- HTML の task と microtask の処理順序、および checkpoint の実施時点は runtime が管理する。engine adapter は Promise job の実行と通知に必要な capability を提供する
- Promise job、`queueMicrotask`、および MutationObserver の通知は、同じ event loop の処理規則で調停する。各 callback が独自に engine の job queue を drain しない
- job の実行に必要な realm、settings、および incumbent context を保持し、job 自身の abrupt completion の報告と、Promise の rejection の追跡を分ける
- engine adapter は Promise の reject と handle の通知を runtime へ接続する。runtime は標準の通知時期に従い、page 側の `unhandledrejection` と `rejectionhandled` を処理する
- exception reporting は元の値を保持して `ErrorEvent`、page 側の `onerror`、取消、および再入防止を処理する。host observer へは、その処理後の診断情報だけを渡す
- ADR-0036 の host 観測は page 側の error event の取消から独立させる。page の `try/catch` などで処理された例外や、未処理として通知する時点までに処理された Promise rejection は、未処理例外として host に通知しない

## 影響

- page 例外を処理する境界が、callback wrapper だけでなく、property 操作、conversion、および job の実行にも適用される
- engine adapter の一部の戻り値と、DOM callback port の completion 契約を変更する必要がある
- 複数 realm の callback でも、例外値の identity と標準が指定する報告先を両立できる
- backend ごとの job 実行と rejection 通知を、runtime の実行境界および event loop へ接続する必要がある
- parser-only の DOM と scripting disabled の Window は engine value と engine backend に依存しない
- 既存の host 向け診断情報だけを検証する test に加え、page 内の再送出、error event、rejection 通知、および callback 間の処理順序を検証する必要がある

## 代替案

### callback の呼び出しだけを completion 境界にする

getter、Proxy trap、conversion、property 定義、および job の例外が同じ契約から外れるため採用しない。

### engine backend に HTML の scheduling と例外処理の方針を持たせる

standard algorithm と実行順序が backend ごとに分かれ、engine adapter の責務も広がるため採用しない。

## 参考資料

- [Design log](../design-log/0049-page-realm-execution-contract.md)
- [ADR-0048: 補足対象の例外処理方針](./0048-page-realm-exception-boundary.md)
- [ADR-0026](./0026-javascript-engine-connection.md)
- [ADR-0028](./0028-window-classic-script-execution.md)
- [ADR-0036](./0036-window-error-reporting.md)
- [ADR-0041](./0041-web-idl-realm-binding-boundary.md)
- [ADR-0047](./0047-window-scripting-separation.md)
- [Web IDL: Invoking callback functions](https://webidl.spec.whatwg.org/#invoke-a-callback-function)
- [Web IDL: Creating and throwing exceptions](https://webidl.spec.whatwg.org/#es-creating-throwing-exceptions)
- [HTML Standard: Report an exception](https://html.spec.whatwg.org/multipage/webappapis.html#report-an-exception)
- [HTML Standard: HostEnqueuePromiseJob](https://html.spec.whatwg.org/multipage/webappapis.html#hostenqueuepromisejob)
- [HTML Standard: HostPromiseRejectionTracker](https://html.spec.whatwg.org/multipage/webappapis.html#hostpromiserejectiontracker)
