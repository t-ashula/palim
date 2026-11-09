# ADR-0048: page realm の例外の処理

## ステータス

accepted

## コンテキスト

ADR-0026 は engine が返す `throw` result を opaque な engine value として扱い、ADR-0036 は未処理の page realm 例外を Window environment の error handler へ報告する方針を定めた。

一方、engine callback を engine 非依存の DOM、Window、および Web IDL 処理から呼び出す経路では、callback の `throw` result を host JavaScript の `Error` に変換して throw している。
engine adapter は host function から throw された値を一律に捕捉し、新しい page realm の `TypeError` に変換する。

この組み合わせにより、page realm の例外が host exception として呼び出し元へ漏れる経路と、元の例外とは異なる page realm の例外として呼び出し元へ戻る経路が生じている。
例外の identity、種類、および stack が失われ、event listener の例外を報告して dispatch を継続する処理も行われない。

page realm で throw された値、standard が生成する例外、および palim 自身の host failure を同じ host の throw 経路で運ばない設計が必要である。

## 決定

- page realm の callback が throw した場合は、元の engine value、発生元 realm、および対応する environment settings を保持した `throw` result を binding から呼び出し側へ渡す
- page realm の例外を host JavaScript の `Error`、`TypeError`、または文字列へ変換して callback の呼び出し経路を運ばない
- callback を呼び出す standard algorithm は、例外時の処理を少なくとも「元の engine value を呼び出し元へ戻す」と「発生元 global へ報告して algorithm を継続する」に分類する
- Promise を返す処理など別の exception behavior を必要とする callback は、その処理を呼び出し側で明示し、暗黙に再送出または報告へ分類しない
- event listener、observer、timer、および reaction のように例外を報告する callback は、元の engine value を Window environment の error reporting へ渡し、host の call stack へ throw しない
- traversal filter のように例外を再送出する callback は、同じ engine value を同期的な page realm の呼び出し元へ戻し、別の例外を生成しない
- Web IDL conversion や DOM operation が規定する例外は、binding が対象 realm の例外を明示的に生成し、`throw` result として返す
- palim の invariant 違反、adapter の誤用、および予期しない host exception は host failure として扱い、engine adapter が page realm の `TypeError` へ一律に変換しない
- engine 非依存の DOM および Window layer は engine value に依存せず、callback completion または exception reporting capability を binding から受け取れる port を使用する
- host 向け error report は page realm の値を直接公開せず、realm 内の exception reporting に必要な処理を終えた後の message、URL、および stack などの観測用情報だけを渡す
- callback の種類ごとに独立した例外変換を実装せず、binding と runtime が共有する completion と reporting の規則を使用する

## 影響

- engine adapter、realm binding、DOM callback、および Window error reporting の間に、page realm の `throw` result と host failure を区別する契約が必要になる
- event listener の例外は `dispatchEvent()` の呼び出し元へ伝播せず、報告後も後続 listener と dispatch が継続する
- host から event を dispatch した場合も、page realm の例外が host exception として throw されなくなる
- 再送出を規定する callback では、throw された値の identity を page realm 内で維持できる
- error reporting は発生元 realm と global を基準にするため、iframe と複数 realm の callback でも報告先を target object だけから推測しなくて済む
- parser-only の DOM は engine value と Window error reporting に依存しない
- 予期しない host failure が page script から通常の `TypeError` に見えなくなるため、host execution entry point の失敗として検出できる
- event listener、MutationObserver、custom element callback、traversal filter、timer、microtask、Promise job、および proxy trap の既存経路を分類して移行する必要がある

## 代替案

### すべての callback 例外を page realm の `TypeError` に変換する

元の例外の identity、種類、および発生元を失い、standard が規定する報告と再送出を区別できないため採用しない。

### page realm の例外を専用の host `Error` subclass で運ぶ

host の call stack に page realm の例外が現れる構造が残り、catch 位置の不足によって再び host failure と混同されるため採用しない。

### callback ごとに個別の catch と error handler 呼び出しを追加する

同じ callback が呼び出し元によって異なる exception behavior を必要とする場合に規則が分散し、新しい callback の追加時に同じ問題を再発させるため採用しない。

### engine value を DOM implementation に保持する

parser-only の DOM が engine adapter と realm lifecycle に依存するため採用しない。

## 参考資料

- [Design log](../design-log/0048-page-realm-exception-boundary.md)
- [ADR-0026](./0026-javascript-engine-connection.md)
- [ADR-0027](./0027-window-execution-environment.md)
- [ADR-0034](./0034-window-host-execution-entry-point.md)
- [ADR-0036](./0036-window-error-reporting.md)
- [ADR-0041](./0041-web-idl-realm-binding-boundary.md)
- [ADR-0047](./0047-window-scripting-separation.md)
- [DOM Standard: Inner invoke](https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke)
- [Web IDL: Invoking callback functions](https://webidl.spec.whatwg.org/#invoke-a-callback-function)
- [HTML Standard: Runtime script errors](https://html.spec.whatwg.org/multipage/webappapis.html#runtime-script-errors)
