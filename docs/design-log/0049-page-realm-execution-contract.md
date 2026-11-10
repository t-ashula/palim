# ADR-0049 Design log: page realm の実行境界と completion 契約

## 調査の位置づけ

2026-11-10 の静的調査と仕様照合に基づく。
この調査では実装変更、テスト実行、および失敗の実行再現は行っていない。

ADR-0048 の例外処理方針を維持し、実行境界の所有者、adapter の completion 契約、および Promise job と rejection の接続を具体化する。
既存の ADR-0048 とその design log は決定時点の記録として保持する。

## 実装との差分

以下は調査時点の構成であり、実装完了を示すものではない。

| 経路 | 調査時点の処理 | 必要な契約 |
| --- | --- | --- |
| host function と Proxy trap | callback の normal / throw を engine の completion へ戻し、予期しない host exception の一律変換は行っていない | この区別を維持し、他の adapter 操作にも適用する |
| event listener、MutationObserver、および custom element callback | throw value を `reportException` へ渡す接続がある | callback の context を保持して page 内の報告処理へ接続する |
| Window exception reporting | `windowErrorReport` で message と stack を抽出し、`reportWindowError` で host handler に配送する | 元の値で page 側の `ErrorEvent` と event handler の処理を行い、その後に host へ通知する |
| traversal filter | `EngineRealmException` を host の throw で運び、binding で元の値へ戻す | engine 非依存の callback port で abrupt completion を明示的に返す |
| property 定義と prototype 操作 | `void` の adapter 操作が engine の abrupt completion を host `TypeError` に置き換える | page の影響を受ける操作は元の completion を返す |
| timer、microtask、および observer の実行終了 | 各 wrapper が直接 call と Promise checkpoint を行う | 標準が指定する実行前後の処理を共通 runtime が調停する |
| microtask scheduling | MutationObserver は host Promise、Window microtask は host queue、Promise job は engine checkpoint を使用する | 同じ event loop の処理規則で順序と checkpoint を調停する |
| Promise rejection | adapter の Agent に rejection tracker と uncaught job failure の通知先が接続されていない | reject / handle と job 自身の abrupt completion を runtime へ通知する |

調査した主な箇所は次のとおり。

- `packages/scripting/src/javascript-engine/adapter.ts`: `EngineResult`、property 操作、および checkpoint の契約
- `packages/engine262/src/engine262-adapter.ts`: Agent の構成、property 操作、host function、Proxy trap、および checkpoint
- `packages/scripting/src/javascript-engine/dom-realm-binding-context.ts`: event listener、custom element callback、および traversal filter
- `packages/scripting/src/javascript-engine/dom-realm-interface-constructors.ts`: MutationObserver callback
- `packages/scripting/src/javascript-engine/window-realm-binding-context.ts`: reporting capability と replaceable 属性の setter
- `packages/scripting/src/javascript-engine/window-error-report.ts`: exception の診断情報への投影
- `packages/scripting/src/javascript-engine/window-realm-interface-installers.ts`: timer と microtask
- `packages/scripting/src/javascript-engine/window-classic-script.ts`: settings stack と script 終了時の checkpoint
- `packages/core/src/dom/mutation-observer.ts`: observer 通知の enqueue
- `packages/window/src/window.ts`: host の scheduling と error handler への配送
- `vendor/engine262/src/host-defined/engine.mts`: rejection tracker の hook
- `vendor/engine262/src/host-defined/event-loop.mts`: job の abrupt completion の通知

## 責務

| 層 | 所有する処理 |
| --- | --- |
| DOM / Window implementation | engine 非依存の状態と standard algorithm、callback の例外時に algorithm を継続するか戻るかの判断 |
| realm binding | Web IDL conversion、wrapper identity、標準例外の生成、および callback record の構築 |
| scripting runtime | realm / settings の準備と復元、completion と callback context の保持、標準が指定する例外処理、および event loop との調停 |
| engine adapter | opaque handle、engine 操作の normal / throw、Promise job の実行、および reject / handle の通知 |
| host observer | page 側の処理後の診断情報の受け取り |

runtime が実行境界を所有することは、DOM や Window の standard algorithm を binding に複製することを意味しない。
engine 非依存層は callback capability と completion を表す port を使用し、engine value の意味や backend 固有型に依存しない。

## 値と実行 context

次の情報を区別する。

| 情報 | 用途 |
| --- | --- |
| 元の throw value | 再送出、`ErrorEvent.error`、または rejection reason の identity の保持 |
| callback の associated realm と relevant settings | callback の実行準備と、標準が指定する報告先の特定 |
| 登録時の callback context | incumbent settings に関係する callback の準備と復元 |
| 呼び出し元 algorithm の context | 再送出、報告、または rejection の選択と、その後の algorithm の継続 |
| job の realm と実行 context | job の実行準備・復元と、abrupt completion の報告 |

例えば realm A の callback が realm B で生成した object を throw しても、元の値は B の object のまま保持する。
報告を必要とする callback では、その標準が指定する global を使用し、object の作成元を報告先にしない。
`throw undefined` や `throw null` でも同じ契約を適用する。

これらの context をすべて `EngineResult` 自体に埋め込むことは要求しない。
callback record や scoped な invocation capability と組み合わせて、必要な context が処理の途中で失われないことを契約とする。

## 例外時の処理

| 処理 | 値の扱い | 継続 |
| --- | --- | --- |
| rethrow | 元の値を abrupt completion として戻す | caller の page code または上位の standard algorithm が処理する |
| report | 元の値を報告先 global の exception reporting に渡す | 呼び出す standard algorithm に従って継続する |
| reject | 元の値を Promise の rejection reason にする | rejection tracking と通常の Promise 処理に接続する |

callback body だけでなく、`handleEvent` や `acceptNode` の property 取得、引数変換、および戻り値変換の abrupt completion も対象とする。
custom element の constructor、upgrade、および reaction は、それぞれの algorithm が定める処理を選ぶ。

標準例外を新しく作る場合は operation の実行時の current realm を使用する。
この realm は receiver の realm や呼び出し側 script の realm と常に一致するわけではない。

## 非同期処理と reporting

HTML task queue と engine の Promise job queue は異なる責務を持つ。
adapter が queue を単独で処理し続ける構成や、callback wrapper が個別に checkpoint を行う構成を避け、runtime が標準の event loop の規則に従って調停する。
Promise job 自身の abrupt completion と、Promise rejection の未処理判定は分ける。

page 側の exception reporting は、元の値と error 情報を保持し、`ErrorEvent`、標準の `onerror`、取消、muted errors、および再入防止を処理する。
message や stack の取得が page code を実行して失敗する場合も、元の throw value を置き換えたり、host exception に変換したりしない。

host 向けの診断配送は page 側の処理後に行う。
error event の取消による標準の報告抑制と、ADR-0036 の host 観測の独立性を両立させる。
page script の `try/catch` で処理済みの例外は、host の未処理例外通知の対象にしない。

cleanup、checkpoint、および reporting の順序を一律には固定しない。
callback invocation、classic script、および job のそれぞれについて、標準が指定する準備と終了処理の順序を共通 runtime に適用する。

## 検証条件

以下は実装時の検証条件であり、この起票で実行した test 結果ではない。

- 同期的に再送出する任意の object、primitive、`undefined`、および `null` を、page の呼び出し元が元の値として catch できる
- getter、Proxy trap、型変換、iterator、および property 定義の abrupt completion も、元の値のまま page の呼び出し元へ戻る
- page code の影響を受ける property 操作の失敗を、host の `TypeError` に置き換えない
- event listener の例外を page の error event で観測でき、元の値を `event.error` から取得できる
- event listener の例外は host と page の `dispatchEvent()` の呼び出し元へ伝播せず、停止条件がなければ後続 listener が実行される
- 別 realm の object を throw した callback でも、値の identity と標準が指定する報告先を保持する
- callback の associated realm と登録時の incumbent settings が異なる場合も、それぞれを準備・復元する
- traversal filter の abrupt completion で traversal の実行中状態を復元し、同じ値を再送出する
- reporting 中の callback や診断情報の取得が例外を起こしても、元の値を失わず、再入を制御し、同じ報告対象を重複配送しない
- error event が取り消されても ADR-0036 の host 観測を抑制せず、page の `try/catch` で処理済みの例外を未処理として通知しない
- timer、microtask、observer、および Promise job が必要な settings と終了処理を共通の実行境界で使用する
- Promise job、`queueMicrotask`、および MutationObserver の順序が同じ event loop の規則に従う
- 同じ checkpoint 内に rejection handler が追加された場合と、未処理通知後の task で追加された場合を区別し、`unhandledrejection` と `rejectionhandled` の reason の identity を保持する
- job 自身の abrupt completion が失われず、Promise の通常の rejection と区別して報告される
- 予期しない host failure を page の通常例外へ変換しない
- parser-only と scripting disabled の import graph に engine backend を持ち込まない

project test は adapter 契約と各層の接続を確認する。
Web Platform の適合性は page realm を使用する WPT browser profile で確認し、host 向け診断だけの assertion で完了としない。

## 参考資料

- [ADR-0049](../decisions/0049-page-realm-execution-contract.md)
- [ADR-0048](../decisions/0048-page-realm-exception-boundary.md)
- [ADR-0026](../decisions/0026-javascript-engine-connection.md)
- [ADR-0036](../decisions/0036-window-error-reporting.md)
- [ADR-0041](../decisions/0041-web-idl-realm-binding-boundary.md)
- [ADR-0044](../decisions/0044-remove-wpt-dom-shell-profile.md)
- [Web IDL: Invoking callback functions](https://webidl.spec.whatwg.org/#invoke-a-callback-function)
- [Web IDL: Invoking callback interface operations](https://webidl.spec.whatwg.org/#call-a-user-objects-operation)
- [Web IDL: Creating and throwing exceptions](https://webidl.spec.whatwg.org/#es-creating-throwing-exceptions)
- [DOM Standard: Inner invoke](https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke)
- [HTML Standard: Report an exception](https://html.spec.whatwg.org/multipage/webappapis.html#report-an-exception)
- [HTML Standard: HostEnqueuePromiseJob](https://html.spec.whatwg.org/multipage/webappapis.html#hostenqueuepromisejob)
- [HTML Standard: HostPromiseRejectionTracker](https://html.spec.whatwg.org/multipage/webappapis.html#hostpromiserejectiontracker)
