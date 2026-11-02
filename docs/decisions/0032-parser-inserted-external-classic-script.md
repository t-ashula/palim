# ADR-0032: parser-inserted external classic script の resource loading 境界

## ステータス

accepted

## コンテキスト

ADR-0030 では parser-inserted inline classic script を Window execution environment へ接続したが、`src` を持つ script は実行できない。
external script を接続するには resource の取得中に parser を停止し、取得後に同じ Window realm で実行してから parse を再開する必要がある。

HTML parser が resource I/O や JavaScript engine を所有すると、parser-only の import boundary と script execution layer の責務が崩れる。

## 決定

- parser-inserted external classic script の resource loading は script execution layer が所有する
- resource loading は host から注入する非同期 loader を使用し、HTML parser に resource I/O と engine 固有型を持ち込まない
- parser は parser-blocking script の loading と実行が完了するまで停止し、その後同じ tree builder で処理を再開する
- resource loading を接続する Window 側の HTML parsing entry point は非同期 API とし、parser-only の API は同期のまま維持する
- 初期実装には network client と request policy を含めず、loader が取得結果または失敗を返す境界だけを定める
- loading、decoding、または実行の失敗を HTML parsing entry point の host exception に変換しない

## 影響

- parser-inserted external classic script が inline script と同じ Window realm、active `Document`、および実行順序を使用できる
- WPT の外部 script resource を project 側の loader から供給できる
- Window execution environment の HTML parsing entry point を使用する呼び出し側は非同期完了を待つ必要がある
- actual network access、cache、および security policy の接続には後続の決定が必要になる

## 代替案

### HTML parser が URL を取得する

parser-only の import graph に resource I/O が入り、script execution layer の外で loading policy を持つため採用しない。

### 同期 loader を使用する

parser の停止を同期 I/O に固定し、network と fixture の loader を同じ境界で扱えないため採用しない。

### parse 完了後に external script を実行する

parser-blocking script の document state と inline script を含む実行順序が変わるため採用しない。

## 参考資料

- [Design log](../design-log/0032-parser-inserted-external-classic-script.md)
- [ADR-0028](./0028-window-classic-script-execution.md)
- [ADR-0030](./0030-script-element-classic-script-execution.md)
- [WHATWG HTML: The script element](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element)
- [WHATWG HTML: Fetching scripts](https://html.spec.whatwg.org/multipage/webappapis.html#fetch-a-classic-script)
