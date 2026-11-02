# ADR-0030: parser-inserted script element と classic script の接続

## ステータス

accepted

## コンテキスト

ADR-0028 により、Window environment settings を使用して classic script を作成・実行できるようになった。
現在は host が source text を runtime へ直接渡す必要があり、HTML parser が生成した `script` element は実行されない。

parser が JavaScript engine や Window runtime を直接参照すると、parser-only の import graph と script execution の接続が崩れる。
一方、parse の完了後に `script` element を列挙して実行すると、parser-inserted script の実行位置と document state を維持できない。

## 決定

- parser-inserted script の処理時点から ADR-0028 の classic script runtime へ接続する
- engine と runtime の組み立ては script execution entry point が所有し、HTML parser には engine 固有型を持ち込まない
- Window environment へ接続した parse では、active `Document` と Window realm を確立してから script を実行する
- 初期対象は parser-inserted inline classic script とし、external script の取得と実行は含めない
- parse error と runtime exception を host exception へ変換せず、script processing の結果として扱う

## 影響

- HTML source 内の inline classic script が、同じ Window realm と active `Document` を使用して実行される
- script の前後にある markup と実行時の document state の順序を維持できる
- parser-only の利用は JavaScript engine に依存しないまま維持される
- external classic script と WPT testharness の通常の読み込みには、後続の resource loading 対応が必要になる

## 代替案

### parse 完了後に `script` element を列挙して実行する

parser-inserted script の実行位置と、script 実行時に利用可能な document state が変わるため採用しない。

### HTML parser から JavaScript engine を直接呼び出す

parser-only の import graph が engine backend に依存し、ADR-0026 と ADR-0028 の接続境界を迂回するため採用しない。

### 初期実装で external script も扱う

resource fetch、decoding、request policy、および load lifecycle の境界が未決定のため採用しない。

## 備考

### 対象外

- external classic script
- `async`、`defer`、module script、および import map
- dynamically inserted script
- `document.write()` と parser の再入
- script error event と未処理例外の reporting
- CSP、sandbox、および scripting disabled の policy

## 参考資料

- [Design log](../design-log/0030-script-element-classic-script-execution.md)
- [ADR-0026](./0026-javascript-engine-connection.md)
- [ADR-0028](./0028-window-classic-script-execution.md)
- [WHATWG HTML: Script processing model](https://html.spec.whatwg.org/multipage/scripting.html#script-processing-model)
- [WHATWG HTML: The script element](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element)
