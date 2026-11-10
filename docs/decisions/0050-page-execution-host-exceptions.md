# ADR-0050: page execution 中の host exception の処理

## ステータス

accepted

## コンテキスト

ADR-0048 は、page realm で throw された値を host JavaScript の exception に変換せず、元の engine value のまま再送出または報告する方針を定めた。
ADR-0049 は、adapter の誤用、invariant 違反、および予期しない host exception を host failure とし、page の通常例外へ変換しない方針を追加した。

この方針は、host code で exception が発生したことと、その exception が host code で処理されず page の呼び出し元まで伝播したことを区別していない。
host code 内で発生して host code 内で処理された exception は、page execution と関係しない。
page execution から呼び出された host 側の処理であっても、exception が host 側で処理された場合は page から観測されない。

問題になるのは、page execution から呼び出された host 側の処理の exception が host 側で処理されず、page の呼び出し元まで伝播した場合である。
現在はこの host exception が engine の throw completion にならず、page の `try/catch` と未処理例外処理を経由せずに、palim、engine backend、および Node.js の call stack まで伝播する。
一方、すべての host exception を一律に page realm の `TypeError` へ変換すると、standard が規定する例外と実装上の失敗を区別できず、元の種類にかかわらず `TypeError` として観測される。

host 側で exception が発生した時点ではなく、host 側で処理されない exception が page の呼び出し元まで伝播する時点を対象とする処理方針が必要である。

## 決定

- host 側で処理されず page の呼び出し元まで伝播した exception は、page 側の例外として処理する
- host 側で処理された exception と、page から開始されていない host 側の処理の exception は対象外とする
- host exception の変換は個別 API ではなく、host 側の処理から page へ戻る共通の接続箇所で行う

## 影響

- ADR-0048 と ADR-0049 にある「予期しない host exception を page の通常例外へ変換しない」という方針は、host 側で処理されず page の呼び出し元まで伝播した host exception には適用しない
- host 側で処理されず page の呼び出し元まで伝播した host exception は、page の `try/catch`、page exception reporting、または Promise rejection で観測される
- host から同じ implementation を直接呼んだ場合は、page realm の `Error` を生成しない
- adapter の host function と Proxy operation だけでなく、callback、job、scheduler、reporting、および Window の host execution entry point の契約を再検討する必要がある
- host failure の `.toThrow()` を期待する既存 test は、page execution 中のケースと host から直接呼ぶケースに分ける必要がある
- stack の検証は message だけでなく、native frame、page URL、page caller、および host file path の不在を対象にする

## 代替案

### host exception を adapter の外へそのまま throw する

page の例外処理を通らず、host runtime の call stack が観測されるため採用しない。

### host exception を一律に page realm の `TypeError` へ変換する

実装上の失敗を standard の `TypeError` として見せ、error の種類と stack の生成規則も不明確になるため採用しない。

### DOM operation ごとに catch を追加する

対象が DOM に限定され、Window、URL、callback、job、accessor、および Proxy operation に同じ問題が残るため採用しない。

### WPT runner で host stack を削除する

page の `try/catch` と exception reporting が動作しない問題を解決せず、出力だけを変更するため採用しない。

## 参考資料

- [ADR-0026](./0026-javascript-engine-connection.md)
- [ADR-0034](./0034-window-host-execution-entry-point.md)
- [ADR-0036](./0036-window-error-reporting.md)
- [ADR-0048](./0048-page-realm-exception-boundary.md)
- [ADR-0049](./0049-page-realm-execution-contract.md)
