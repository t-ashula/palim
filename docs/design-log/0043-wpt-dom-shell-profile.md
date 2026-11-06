# ADR-0043 Design log: WPT DOM shell profile による適合度計測

## 目的

ADR-0043 で提案する DOM shell profile を、実装境界、test 選択、resource 読み込み、global 隔離、result 分類、および段階的な導入へ接続できる粒度に整理する。

この profile の目的は、palim project が期待値を作らず、固定した upstream WPT を使用して palim package の DOM と HTML operation を検証することである。
WPT browser profile を置き換えず、page realm binding、Window、および browser lifecycle の検証結果とは分離する。

## 検証系列の分離

palim の検証結果を次の四系列に分ける。

| 系列 | 対象 | 期待値の供給元 |
| --- | --- | --- |
| project test | 回帰、module 境界、runner 自体 | palim project |
| WPT DOM shell profile | DOM、layout を伴わない HTML operation、package interface | 固定した upstream WPT |
| WPT browser profile | page realm、Window、resource loading、lifecycle を含む web platform | 固定した upstream WPT と wptrunner |
| consumer interoperability | Readability など実 consumer の利用可否 | 固定した consumer と upstream fixture |

project test と consumer interoperability は、それぞれ有用な検証だが DOM Standard の適合率へ算入しない。
DOM shell profile と browser profile は同じ WPT source を含み得るが、profile 名、host contract、および result を分離する。

## `ShellTestEnvironment` の利用範囲

固定した WPT revision の `resources/testharness.js` は、読み込み時に global を調べて test environment を一度だけ選択する。
`document` が存在する場合は `WindowTestEnvironment` を選び、window、load event、DOM result output、および message transport を使用する。
これらの worker、Window、および ShadowRealm 条件に該当しない場合は `ShellTestEnvironment` を選ぶ。

`ShellTestEnvironment` が提供するのは次の処理だけである。

- test source の読み込み完了を最初の microtask 後に通知する
- unnamed test の表示名を生成する
- browser 用 result output と message transport を作らない
- default harness timeout を設定しない

`test()`、`promise_test()`、assertion、cleanup、subtest status、および completion callback は共通の `testharness.js` が提供する。
DOM、resource loader、timer、network、Window、または result file の生成は `ShellTestEnvironment` の責務ではない。

WPT が定義する `jsshell` scope は DOM を持たない。
DOM shell profile は `ShellTestEnvironment` を利用するが、WPT の公式 `jsshell` scope と同じものとして扱わない。

## Test context の生成順序

各 test source に対して新しい隔離 execution unit と新しい active document を生成する。
execution unit と JavaScript realm を test source 間で共有しない。

test source、testharness、および palim package は同じ JavaScript realm で評価する。
親 realm から palim constructor を別の `vm` context へそのまま渡すと、palim が生成する `TypeError` と test context の `TypeError` の identity が異なり、Web IDL assertion の結果を変える。
同様に constructor、prototype、callback、および iterator の identity も cross-realm wrapper によって変えない。

初期実装では一つの test source を一つの Node.js worker または child process で実行し、その execution unit 内で palim package を import する構成を基本とする。
coordinator は result の受信、外側の timeout、および execution unit の終了だけを担当する。

基本的な生成順序は次とする。

1. Node.js の隔離 execution unit と JavaScript realm を生成する
2. 同じ realm で palim package を import する
3. `self`、result collector、および harness が必要とする ECMAScript capability だけを準備する
4. `document`、Window、および Node.js Web API が存在しない状態で固定 revision の `testharness.js` を評価する
5. `ShellTestEnvironment` が選択されたことを runner contract として確認する
6. `add_result_callback` と `add_completion_callback` を登録する
7. palim package の公開 interface と test document を同じ realm の global へ接続する
8. upstream helper script と test script を source order で評価する
9. harness completion、runner error、または外側の timeout を result として確定する
10. execution unit と document を破棄する

testharness の private object を参照して environment を切り替えたり、harness source を patch したりしない。
`document` を harness 評価後に追加する方式は WPT の標準 scope ではないため、run metadata に host profile として明示する。

## Global allowlist

Node.js 24 は `fetch`、`Event`、`EventTarget`、`AbortController`、`URL` など複数の Web API を global に持つ。
test execution unit の global は、Node.js が既定で公開する Web API を遮断し、公開対象を allowlist で構成する。
worker または child process 自体は Node.js global を持つため、対象 property を削除または明示的に shadow できることを起動時に検査する。
遮断できない Node.js Web API がある場合は、その execution unit を有効な DOM shell host として使用しない。

最初の allowlist は次の分類を持つ。

### ECMAScript capability

- test realm 自身の ECMAScript intrinsic
- `Promise` と microtask
- `Date`
- testharness の評価と error formatting に必要な最小 capability

### Runner capability

- `self`
- test source を識別する安定した metadata
- coordinator へ result と completion を送る callback
- process 全体を保護する外側の timeout

### palim capability

- package export から取得した DOM、HTML、および関連 interface
- palim が生成した active document
- profile の対象に含める palim の URL または parsing interface

Node.js の `Event`、`EventTarget`、`AbortController`、`AbortSignal`、DOMException、URL、および fetch implementation を fallback として使用しない。
palim が公開していない対象 interface は test 内で未定義となり、profile の対象 standard に含まれる場合は WPT failure として観測する。

`GLOBAL.isWindow()`、`GLOBAL.isWorker()`、および `GLOBAL.isShadowRealm()` によって実行を分岐する test は、DOM shell profile の意味と一致する値を定義できる場合だけ対象にする。
Window としての挙動を要求する test に偽の Window 判定を与えて実行しない。

## Event と非同期処理の境界

`Event`、`EventTarget`、event dispatch、`AbortController`、`AbortSignal`、および `MutationObserver` は DOM Standard の対象である。
これらを browser profile 専用として除外せず、palim の implementation が存在しない場合は failure とする。

同期的な `dispatchEvent()`、listener ordering、capture と bubble、once、passive、abort signal、および dispatch 中の listener 変更は event loop なしで検証できる。

MutationObserver callback の delivery、custom element reaction、task 間の event ordering、および load lifecycle は scheduler との接続を必要とする。
DOM shell profile が提供する microtask contract を別途固定するまでは、host scheduling を必要とする test を browser profile に分類する。
単に `promise_test()` を使用する test は browser lifecycle 依存とはみなさず、ECMAScript Promise だけで完了できるかを判定する。

`ShellTestEnvironment` は default timeout を設定しない。
停止しない promise、test source の top-level error、および harness completion が発生しない場合に備え、runner は context 外側に終了期限を持つ。
testharness が報告した timeout と runner の終了期限超過を同じ status にしない。

## Test document と script の扱い

DOM shell runner は WPT checkout 内の source を入力とし、test source、helper source、および fixture markup を書き換えない。

HTML、XHTML、XML、および SVG source は palim の公開 parsing API で test document を生成する。
`testharness.js` は runner が既に評価しているため、document 内の参照を再評価しない。
`testharnessreport.js` は browser 用 output と message transport のための resource であるため、DOM shell profile では評価せず、runner が testharness の callback から result を収集する。
この処理は test assertion または期待値の置換ではなく、host ごとの result transport の選択として記録する。

その他の inline script と local helper script は source order を維持して評価する。
WPT checkout root を基準にした absolute path と、test source を基準にした relative path を決定的に解決する。
query と fragment、`.sub` preprocessing、server-side handler、redirect、HTTP header、および network response を必要とする resource は、対応する upstream 処理を実装するまで host unsupported とする。

test document 全体を parse してから script を評価すると、browser の parser-blocking script より後ろにある node が早く観測可能になる。
初期実装では次のいずれかを満たす source だけを実行対象とする。

- `.any.js` であり active document を必要としない
- test が使用する fixture markup が最初の test script より前に完成している
- test 自身が公開 DOM API で fixture document または対象 subtree を生成する

parser pause、`document.write()`、parser-inserted script、後続 markup の可視性、または script element の実行 semantics を assertion が利用する test は browser profile に分類する。
この適格条件は source structure から決定し、palim の pass または fail に応じて変更しない。

## Local resource 解決と Fetch の分離

runner が固定 checkout から helper script を読む処理は、WPT test page へ公開する Fetch API ではない。
local resource resolver は次だけを行う。

- manifest で test source を特定する
- WPT checkout 内へ閉じた path を解決する
- source bytes と digest を記録する
- helper script を同じ隔離 context で評価する

test code が `fetch()`、XHR、navigation、external resource loading、または response metadata を観測する場合、その test は最初の DOM shell profile の対象外とする。
Node.js の `fetch` で不足を補わない。

## 対象集合の決定

最初の候補 directory は現在の WPT browser profile と対応する次の領域から選ぶ。

- `/dom/collections/`
- `/dom/events/`
- `/dom/lists/`
- `/dom/nodes/`
- `/dom/ranges/`
- `/dom/traversal/`
- `/domparsing/`
- `/html/dom/documents/dom-tree-accessors/`
- `/html/dom/elements/`

固定済み WPT revision の manifest では、これらの領域に 900 test source がある。
内訳は HTML 759、XHTML・XML・SVG など 90、`.window.js` 41、`.any.js` 9、およびその他 JavaScript 1 である。
`.any.js` 9件はすべて `/dom/events/` に属する。

source と参照される local helper script の静的な語彙調査では、次の依存候補が見つかった。
件数は互いに重複し、条件分岐内の参照と単なる文字列も含み得るため、実行可能件数または非対応件数として使用しない。

| 依存候補 | source 数 |
| --- | ---: |
| iframe または別 context | 138 |
| layout または CSS geometry | 160 |
| navigation または document lifecycle | 109 |
| test code からの network API | 5 |
| `async_test()` または `promise_test()` | 265 |

明白な iframe、network、layout、および navigation 参照がない source は603件であり、さらに async test marker がない source は538件だった。
これらは profile 設計の規模を見積もる候補値であり、適合度、実行保証、または最終的な母数ではない。

最終的な対象集合は次の順に決定する。

1. 固定 WPT manifest と directory scope から全 source を列挙する
2. source type と生成される test URL を記録する
3. host capability 条件を機械的に評価する
4. runnable、browser-profile-only、host-unsupported、および runner-error を区別する
5. runnable source は palim の実装状況を理由に除外しない

個別 test path の手動 allowlist を profile の母集団にしない。
静的判定で確定できない source は理由とともに保守的な分類へ置き、分類規則の変更を report metadata に記録する。

## Result と report

一つの run は少なくとも次を固定する。

- WPT revision と manifest digest
- DOM shell profile schema version
- directory scope と capability classification rule の digest
- palim revision と dirty state
- Node.js version
- testharness source digest
- global allowlist
- runner timeout

source result は少なくとも次を持つ。

- source path と生成 test URL
- source と helper の digest
- profile eligibility と分類理由
- harness status
- subtest name、status、message、および stack
- runner error または終了期限超過
- duration

status は少なくとも次を区別する。

- `pass`: harness と全対象 subtest が成功した
- `fail`: WPT assertion または test が失敗した
- `error`: testharness が実行 error を報告した
- `timeout`: testharness が timeout を報告した
- `host-unsupported`: test が profile 外の host capability を必要とする
- `browser-profile-only`: test の目的が Window、realm、layout、navigation、または lifecycle にある
- `runner-error`: source の解決、評価、result 収集、または runner 自体が失敗した
- `pending`: 対象集合に含まれるが結果がない

palim の DOM interface が未実装であることを `host-unsupported` に読み替えない。
同じ source から一部 subtest だけを profile 外として黙って除外しない。
一つの source が profile 内外の subtest を混在させる場合は、upstream で source が分割されるまで source 全体を browser profile に分類する。

DOM shell report は既存の WPT browser progress report と別 path、別 suite key、および別 schema で保存する。
二つの profile の合格数、母数、および成功率を足し合わせない。

## 実装単位

依存 package は追加しない。
Node.js built-in と既存の palim package、および固定済み WPT checkout を使用する。

### 1. Shell harness spike

- 隔離 execution unit の同じ realm で palim package と upstream `testharness.js` を評価する
- `document` がない状態で harness を初期化する
- completion callback から structured result を取得する
- Node.js Web API が test global に存在しないことを確認する
- `/dom/events/` の9件の `.any.js` source を対象集合として列挙し、個別 source を実行する

この段階では合格を実装完了条件にしない。
upstream subtest を列挙し、palim の pass、fail、および error をそのまま取得できることを確認する。

### 2. Fixture document と local helper

- markup source から palim の active document を生成する
- local helper script の path、source order、および digest を保持する
- fixture 完成条件を満たす同期 DOM test を実行する
- `testharnessreport.js` に依存せず result を収集する
- script timing 条件を満たさない source を browser profile に分類する

最初の representative source は、単一 document で完結し、layout、iframe、network、および lifecycle を使用しない Node、collection、Range、または traversal test から選ぶ。
選定理由は capability rule から説明できるようにし、pass することを理由に選ばない。

### 3. Manifest 分類と report

- directory scope 全体を manifest から列挙する
- capability classification を決定的に生成する
- source result と subtest result を保存する
- profile 固有の JSON と Markdown report を生成する
- ad hoc source 実行と固定対象全体の report 更新を分離する

### 4. 非同期 DOM capability

- Promise だけで完了する test を同期 test と同じ profile へ加える
- MutationObserver delivery と microtask checkpoint の host contract を設計する
- timer、task、custom element reaction、および lifecycle を必要とする test との境界を更新する

classification rule または host contract を変更した場合は profile schema version を更新し、過去 result と自動的に混在させない。

## Project test の役割

runner の project test は次を確認する。

- Node.js Web API が test global に漏れない
- upstream harness source を変更せず読み込む
- local path が WPT checkout 外へ出ない
- source order と digest が決定的である
- pass、fail、error、timeout、および runner failure を区別する
- harness completion が一度だけ通知される
- test source 間で execution realm、global、および document を共有しない
- unsupported classification が palim の pass または fail に依存しない

これらは runner の動作確認であり、DOM Standard の期待値を project test に記述しない。
実際の DOM operation の期待結果は upstream WPT subtest から取得する。

## 完了条件

- ADR-0043 が accepted になっている
- 固定 WPT revision の `testharness.js` と test source を patch せず評価できる
- Node.js の Web API を遮断し、palim package と test source が同じ realm で評価される隔離 execution unit である
- `/dom/events/` の `.any.js` source について upstream subtest result を取得できる
- 少なくとも一つの markup based DOM test で fixture document、local helper、および source order を扱える
- pass する test path の手動 allowlist なしに対象集合を生成できる
- browser-profile-only、host-unsupported、palim failure、および runner failure を区別できる
- DOM shell profile の JSON と Markdown report が browser WPT report と分離される
- project test の期待値を DOM shell profile の適合度へ算入しない
- 新しい依存 package を追加していない

## 参考資料

- [ADR-0043](../decisions/0043-wpt-dom-shell-profile.md)
- [ADR-0002](../decisions/0002-compliance-measurement.md)
- [ADR-0033](../decisions/0033-wptrunner-product-integration.md)
- [ADR-0035](../decisions/0035-wpt-document-resource-loading.md)
- [ADR-0038](../decisions/0038-wpt-progress-report.md)
- [ADR-0040](../decisions/0040-wpt-partitioned-campaign.md)
- [WPT testharness](../../conformance/wpt/wpt/resources/testharness.js)
- [WPT manifest](../../conformance/wpt/wpt/MANIFEST.json)
