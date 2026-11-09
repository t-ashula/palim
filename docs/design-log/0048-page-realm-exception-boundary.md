# ADR-0048 Design log: page realm の例外の処理

## 調査範囲

2026-11-09 時点の次の経路を対象に、page realm の abrupt completion がどの表現で layer 間を移動するかを確認した。

- engine adapter の host function と proxy trap
- DOM event listener と `dispatchEvent()`
- traversal filter
- MutationObserver callback
- custom element constructor と lifecycle callback
- classic script、timer、および microtask の error reporting
- Window environment の host error handler

## 問題

page realm で throw された値は page realm に属する例外として処理する。
event listener で処理されなかった例外は、発生元 page realm の error reporting へ渡し、event dispatch を継続する。
host へは error reporting の結果だけを通知し、page realm の例外を host JavaScript の exception として throw しない。

現在の実装は、page realm の例外から message を取り出して host の `Error` を生成している。
この時点で page realm の例外が host exception に変わり、元の例外 object、種類、および stack が失われる。

## 現在の変換経路

event listener では次の順序で変換が起きる。

1. page realm の listener が `RangeError` object を throw する
2. engine adapter の `call()` が元の object を `EngineResult` の throw variant として返す
3. DOM realm binding の event listener wrapper が message を取り出し、host の `new Error(message)` を throw する
4. engine adapter まで処理が戻ると、adapter が host の `Error` を捕捉する
5. engine adapter が message だけを使って、新しい page realm の `TypeError` を生成する

手順 3 で page realm の値と realm 情報を失い、手順 5 で元の例外とは異なる `TypeError` が page realm に作られる。

## 根本原因

### callback completion の表現が途中で途切れている

engine adapter の同期操作は normal と throw を区別する `EngineResult` を返す。
しかし engine 非依存の DOM callback は `void`、数値、または domain object を返す host function として定義されており、abrupt completion を表現できない。

realm binding はこの型の差を埋めるために host の throw を transport として使用している。
これは engine value を opaque handle として渡す仕組みと、host JavaScript の exception mechanism を同じ transport として扱う構造になっている。

### exception behavior の所有者が定まっていない

callback の例外をどう処理するかは callback 自体ではなく、callback を呼び出す standard algorithm が決める。

- event listener と MutationObserver callback は例外を報告して処理を継続する
- traversal filter は元の例外を同期的な呼び出し元へ戻す
- Promise を返す callback は rejected promise を必要とする場合がある
- custom element callback は constructor、upgrade、reaction の各 algorithm に従って扱いが異なる

現在は binding の各 callback wrapper が message 化、host throw、または Window error report を個別に選んでいる。
このため同じ engine callback の結果に一貫した規則を適用できない。

### adapter が予期しない host failure を realm 例外へ変換している

engine adapter の host function と proxy trap は callback から throw された値を一律に捕捉し、page realm の `TypeError` を作る。
この catch は adapter の invariant 違反や programming error を page script が処理できる通常の例外に変え、host 側の失敗を隠す。

Web IDL が要求する `TypeError` は binding が対象 realm を指定して明示的に生成できる。
したがって adapter の catch-all は standard exception の生成には不要であり、page realm 例外の transport と host failure の隠蔽を同時に引き起こしている。

### error reporting capability がすべての callback 経路へ届いていない

classic script、timer、および microtask には Window error reporting への接続がある。
DOM realm binding の event listener、MutationObserver、および一部の custom element callback には同じ reporting capability がなく、message を host `Error` へ変換している。

Window error report は現在 message、URL、および任意の stack を扱う。
page realm の値を host observer に公開しないことは維持しつつ、binding から reporting algorithm までは元の engine value と発生元 realm を保持する必要がある。

## callback completion の契約

binding と runtime の間では、realm callback の結果を次の情報を持つ completion として扱う。

| 情報 | 用途 |
| --- | --- |
| normal value | 呼び出し側 algorithm の継続 |
| abrupt completion の engine value | identity を保った再送出または exception reporting |
| 発生元 realm | exception object の所属と callback の associated realm の特定 |
| environment settings または reporting capability | error event と host error handler の報告先の特定 |

engine 非依存 layer は engine value を解釈または保持しない。
domain callback port が completion を返せる形にするか、binding が domain callback の呼び出し直後に exception behavior を適用する。
どちらの場合も host の throw を page realm 例外の transport に使用しない。

## exception behavior

### rethrow

呼び出し側 algorithm が例外の再送出を規定する場合、元の engine value を同じ realm の abrupt completion として返す。
message の抽出、新しい exception object の生成、および host stack への throw は行わない。

初期監査対象は traversal filter と、Web IDL callback のうち exception behavior が rethrow のものとする。

### report

呼び出し側 algorithm が例外の報告を規定する場合、発生元 callback の associated realm に対応する global へ元の engine value を報告する。
報告後の algorithm は standard に従って継続し、host または page realm の dispatch 呼び出し元へ例外を返さない。

初期監査対象は event listener、MutationObserver callback、timer、microtask、および custom element reaction とする。

reporting の内部では ErrorEvent 用の値と情報を発生元 realm に属する処理の中で扱えるようにする。
host error handler へは page realm の object handle を渡さず、message、URL、および stack などに投影した report を渡す。

### host failure

adapter の所有者不一致、無効な opaque handle、binding の invariant 違反、および予期しない host exception は page realm の completion ではない。
これらは host failure として engine adapter の外へ伝え、ADR-0036 の host operation を継続できない失敗として扱う。

standard が要求する `TypeError` または `DOMException` は host failure に含めず、binding が realm 内の exception object を生成して明示的な abrupt completion を返す。

## 経路の監査

| 経路 | 現在の処理 | 必要な処理 |
| --- | --- | --- |
| classic script | throw result を Window error report へ渡す | 元の value と発生元 settings を reporting まで保持する |
| event listener | throw result を host `Error` に変換する | associated realm へ report し、dispatch を継続する |
| MutationObserver | throw result を host `Error` に変換する | observer callback の realm へ report し、notify 処理を継続する |
| custom element | constructor と callback の throw result を host `Error` または `TypeError` に変換する | constructor、upgrade、reaction ごとの algorithm が指定する behavior を適用する |
| traversal filter | 専用 host `Error` を一時的な carrier として使用する | 元の completion を明示的に caller へ戻す |
| timer と microtask | throw result を Window error report へ渡す | 共通 reporting capability を使用する |
| proxy trap と host function | 予期しない host throw を realm `TypeError` に変換する | 明示的な completion だけを realm へ返し、host failure は host へ伝える |

## 検証条件

- page realm の event listener が任意の object を throw しても、host の `dispatchEvent()` は throw しない
- page realm の `dispatchEvent()` は listener が throw した値を catch できない
- throw した listener の後に登録された listener も、停止条件がない限り実行される
- 一つの abrupt completion に対する Window error report は一回だけ生成される
- reporting の message 化に失敗しても、元の例外を別の page realm `TypeError` へ置き換えない
- traversal filter が throw した値は、page realm の呼び出し元で同じ identity の値として catch できる
- host failure は page realm の通常の `TypeError` として観測されず、host execution entry point の失敗になる
- callback が別 realm の object に登録された場合も、target の realm ではなく callback の associated realm へ報告される
- child Window の callback は対応する child Window environment の error reporting を使用する
- parser-only の test と import graph は engine adapter または Window error reporting を必要としない

## 参考資料

- [ADR-0048](../decisions/0048-page-realm-exception-boundary.md)
- [DOM Standard: Inner invoke](https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke)
- [Web IDL: Invoking callback functions](https://webidl.spec.whatwg.org/#invoke-a-callback-function)
- [HTML Standard: Report an exception](https://html.spec.whatwg.org/multipage/webappapis.html#report-an-exception)
