# ADR-0026 Design log: JavaScript engine との接続境界

## 接続境界

### 目的

engine adapter は実行中に backend を切り替えるための API ではない。palim の共通部分から engine 固有 API と型を隠し、将来 backend を変更するときの修正を接続 module に限定するための境界である。

backend は engine adapter instance の生成時に選択する。realm の生成後に backend を変更すると、realm、intrinsic、constructor、prototype、platform object、および callback の identity が維持できないため、一つの adapter instance に複数 backend を混在させない。

### Layer

| Layer | 責務 | engine 固有型 |
| --- | --- | --- |
| DOM implementation | tree、attribute、event、および DOM algorithm | 使用しない |
| Web IDL binding | interface の定義、operation、conversion、platform object の identity | 使用しない |
| engine adapter interface | realm、value、object、callable の opaque handle と engine 操作の契約 | 公開しない |
| engine adapter implementation | opaque handle と engine 固有型の変換、engine API の呼び出し | この layer 内だけで使用する |

Web IDL binding は interface member と変換規則を engine ごとに実装し直さない。engine adapter が提供する value の判定、primitive conversion、object・function の生成、property definition、callback invocation、および exception creation を使用して、realm 内の interface object と platform object を構築する。

### Opaque handle

palim の共通 module は、engine が返す realm、value、object、および callable を直接参照しない。それぞれを palim が定義する opaque handle として受け取り、handle の内容を調べずに engine adapter へ戻す。

engine262 adapter の場合は、adapter 内部で opaque handle と `ManagedRealm`、`Value`、`ObjectValue`、`FunctionObject` を対応付ける。別の engine を採用する場合は、その engine の realm と value model へ対応付ける adapter implementation を用意する。DOM implementation と Web IDL binding の operation は変更しない。

handle は生成元の adapter instance に属する。異なる instance または異なる backend が生成した handle を受け取った場合は、adapter 境界で拒否する。

### Adapter operation

engine adapter interface は少なくとも次の分類の操作を持つ。

- realm と global object の生成
- source の compile と evaluate
- engine value の種別判定と primitive conversion
- object、function、constructor、および prototype の生成
- property descriptor の定義
- engine callable の呼び出し
- realm に属する exception の生成
- Promise job の checkpoint

DOM tree、event path、HTML task queue、interface member の一覧、および Web IDL operation の処理は adapter に移さない。adapter interface に engine 固有の abstract operation を追加せず、palim の binding と runtime が必要とする操作だけを定義する。

### Test realm

engine adapter と Web IDL binding の接続試験では、adapter が生成した realm を test realm として使用する。
test harness は binding context を生成し、DOM implementation に対応する platform object と、必要な interface object・prototype object を test realm 内に構築する。

platform object は test 用 global property に設定する。
この property は web platform の global exposure を再現するものではなく、評価する source から platform object を参照する入口である。

評価する source は platform object の operation、accessor、constructor、prototype、および callback を使用する。
host 側は `DOMParser` など package が公開する API から得た DOM interface を使って mutation と identity の結果を確認する。
DOM implementation object や engine262 の value を assertion から直接参照しない。

test realm で確認する結果は project integration test として記録する。
Window、Worker、またはその他の web global の exposure と lifecycle は、それぞれの環境を実装した後の適合テストで扱う。

## engine262 の事前評価

### 調査条件

2026-11-02 時点の次の version を対象に、公開資料、npm package の declaration と source、および最小実行結果を確認した。

- package: `@engine262/engine262`
- version: `0.0.1-d553e7b52501fbc47eae981c8d0fa7a5c26d0171`
- publish date: 2026-10-23
- license: MIT

package は palim の依存へ追加せず、`/tmp` に取得して確認した。

### Project の目的

engine262 は JavaScript で実装された ECMA-262 engine である。project は仕様適合、内部状態の観察、および変更の容易さを目標とし、速度を優先目標としていない。

公開 API は ECMA-262 の algorithm と内部 record を広く export している。一般的な application sandbox API よりも、ECMAScript の仕様処理を host が組み立てるための API に近い。

### 接続に利用できる API

| palim から必要になる機能 | engine262 の API | 評価 |
| --- | --- | --- |
| realm と global object の生成 | `ManagedRealm` | custom global object と global `this` を指定できる |
| classic script の compile と評価 | `compileScript()`、`evaluateScript()`、`evaluateScriptSkipDebugger()` | 利用できる |
| module の compile と評価 | `compileModule()`、`evaluateModule()` | 利用できるが、module loading は host hook が必要 |
| host function の公開 | `CreateBuiltinFunction` | 利用できる |
| engine 内 function の呼び出し | `Call` | 利用できる |
| host hook | `AgentHostDefined`、`HostHooks` | module loading、Promise rejection などを設定できる |
| Promise job の処理 | `JobQueue`、`EventLoop.runOnce()` | host から処理時点を制御できる |
| HTML task の処理 | `WebLikeEventLoop` | HTML event loop の実装としては扱わず、palim runtime との接続が必要 |
| DOM object の直接公開 | 該当 API なし | engine262 adapter による value model の変換が必要 |

`ManagedRealm` は global object の初期化、script の compile・evaluate、および realm ごとの intrinsic を提供する。`Agent` は host hook、job queue、および event loop を保持する。

Promise job は script 評価の終了だけでは実行されず、host が event loop を進められる。最小確認では、同期の host function 呼び出しが script 評価中に実行され、`Promise.then()` の callback は `eventLoop.runOnce()` の後に実行された。この制御点は palim runtime から microtask checkpoint を実行する adapter を作る際に利用できる。

### Value model と DOM binding

engine262 が評価する値は host JavaScript の primitive や object ではなく、engine262 の `Value`、`ObjectValue`、`FunctionObject` で表現される。palim が package API として公開している `Document`、`Element`、`Event` などの object を engine262 の global object へ直接設定することはできない。

engine262 を接続する場合は、共有する Web IDL binding が engine adapter を介して、realm ごとに次の object を engine262 の value model で構築する。

- DOM interface object と prototype object
- platform object
- accessor と operation を実行する builtin function
- callback function と event listener の参照
- exception object

platform object と palim の DOM implementation object の対応は、ADR-0025 の binding context ごとに保持する。host JavaScript 向け interface object と engine262 向け platform object は同じ object にはならないが、同じ DOM implementation object を参照できる。

このため engine adapter の境界では、host JavaScript の `object` や `Function` を共通表現として使用できない。realm、value、および callable は palim が定義する opaque handle として扱い、engine262 の固有型との変換を engine262 adapter に閉じ込める。

### Callback と event dispatch

engine262 の評価処理と `Call` は generator-based evaluator を返す。DOM event listener を呼び出すには、active `Agent` と realm の execution context を設定したうえで evaluator を完了させる必要がある。

現在の palim の `EventTargetImplementation` は host JavaScript の function または object を listener として保持し、`dispatchEvent()` の途中で直接呼び出している。この型のまま engine262 の `FunctionObject` を保存することはできない。

engine 接続時の listener は、callback の opaque callable handle と、それを同期的に呼び出す adapter operation の組として保持する必要がある。event dispatch 自体は同期処理のままとし、engine callback の完了または例外を同じ dispatch の中で受け取れることを接続試作で確認する。

### Agent と並行実行

engine262 は active agent を module-level の `surroundingAgent` として保持し、`setSurroundingAgent()` で切り替える。公式 example にも同時に active にできる agent は一つと記載されている。

複数の realm が同じ `Agent` に属する構成は可能だが、独立した複数 agent を同じ JavaScript process で並行実行する adapter には追加の排他と context 切り替えが必要になる。palim の engine adapter を、backend instance が互いに独立して並行実行できる前提にはしない。

### Package と API の安定性

確認した package には通常の dependency はなく、`ws` が optional peer dependency として定義されている。package size は tarball 約 4.1 MB、展開後約 25.1 MB で、ES module bundle は約 4.4 MB だった。

version は `0.0.1-<commit>` 形式で、安定 release や semantic versioning による互換性の範囲は示されていない。公開 entry point は abstract operation、record、value class、および host API を広く export している。palim が利用する場合は exact version を固定し、engine262 API の利用を一つの adapter module に限定する必要がある。

README にある「100% Spec Compliance」は project の目標であり、確認した version の適合結果を示すものではない。source には未実装処理と TODO が残っているため、palim が必要とする構文、built-in、Promise、および callback の範囲を project test で検証する必要がある。

### 最小実行の確認

Node.js v24.22.1 上で次を確認した。

- `Agent` と `ManagedRealm` を生成できる
- classic script の評価結果として `42` を取得できる
- host function を global object へ設定し、script から呼び出せる
- `Promise.then()` の callback は job queue に入り、`eventLoop.runOnce()` で実行される

一回の process 起動で観測した値は、package import 約 46 ms、realm 生成約 17 ms、単純な script 評価約 4 ms、評価後の RSS 約 78 MiB だった。これは計測環境と初期化状態を固定した benchmark ではなく、採用判断や性能目標には使用しない。

### 評価結果

| 判定対象 | 結果 |
| --- | --- |
| realm、script 評価、host function、Promise job の接続可能性 | 接続可能 |
| palim の既存 DOM object の直接利用 | 不可 |
| engine262 adapter から共有 Web IDL binding を利用できるか | API 上は可能。接続試作で検証が必要 |
| backend としての採用 | 保留 |
| 次の評価段階 | 依存追加を伴わない隔離した接続試作 |

engine262 は次の点で接続試作の候補になる。

- realm と global object を host が構成できる
- host function、callback、および completion を仕様処理に近い形で扱える
- Promise job を host 側の時点で実行できる
- engine の value model と host JavaScript object が分離されている

一方、採用前に解消または検証が必要な点がある。

- opaque handle と engine262 value model の変換が必要になる
- engine adapter を介して platform object を構築できることの検証が必要になる
- synchronous event dispatch から generator-based callback を呼び出す経路が必要になる
- module-level active agent により並行実行の構成が制限される
- package version と API に安定性の保証がない
- package size、realm 初期化時間、および DOM wrapper の memory cost を継続計測する必要がある

この事前評価だけでは engine262 の採用を決定しない。ADR-0026 の engine adapter を特定 backend から独立させたまま、engine262 は接続試作の候補として残す。

### 接続試作の確認項目

採用を再検討する場合は、依存追加の前に隔離した試作で次を確認する。

1. engine262 の test realm 内に DOM interface object、prototype object、および platform object を構築し、test 用 global property から参照できる
2. 同じ DOM implementation を繰り返し取得したときに同じ platform object を返す
3. constructor、prototype、property descriptor、および `instanceof` が Web IDL binding の要求を満たす
4. method と accessor の引数・返り値・例外を engine262 value と相互変換できる
5. engine262 の callback を event listener として同期的に呼び出せる
6. callback 内で DOM mutation と event dispatch の再入が発生しても execution context が壊れない
7. Promise job を palim runtime の microtask checkpoint で実行できる
8. 複数 realm の object identity を分離できる
9. script の停止不能、memory 上限、および host capability の公開範囲を制御できる
10. engine262 version 更新時に adapter の互換性を検出できる

project integration test は、source の評価後に host 側の公開 DOM interface から mutation の結果を確認する。
engine adapter 単体の contract test では、realm、opaque handle、primitive conversion、property definition、callable invocation、exception、および Promise job checkpoint を backend ごとに同じ項目で確認する。

## 参考資料

- [ADR-0026](../decisions/0026-javascript-engine-connection.md)
- [engine262 repository](https://github.com/engine262/engine262)
- [engine262 example](https://github.com/engine262/engine262/blob/main/lib-src/node/example.mts)
- [engine262 `ManagedRealm`](https://github.com/engine262/engine262/blob/main/src/api.mts)
- [engine262 host hooks](https://github.com/engine262/engine262/blob/main/src/host-defined/engine.mts)
- [engine262 job queue](https://github.com/engine262/engine262/blob/main/src/host-defined/job-queue.mts)
- [engine262 event loop](https://github.com/engine262/engine262/blob/main/src/host-defined/event-loop.mts)
- [npm: `@engine262/engine262`](https://www.npmjs.com/package/@engine262/engine262)
