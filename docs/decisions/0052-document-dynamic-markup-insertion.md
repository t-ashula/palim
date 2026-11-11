# ADR-0052: Document dynamic markup insertion と parser session

## ステータス

accepted

## コンテキスト

HTML の `Document` は `open()`、`write()`、`writeln()`、および `close()` による dynamic markup insertion を提供する。
現在の palim の document parsing は入力全体を受け取って完了まで処理し、追加入力を受け取る parser session を公開しない。
既存の streaming parser は fragment insertion 用であり、Document の置換、document parser の insertion point、parser-inserted script、および load lifecycle を扱わない。

特に parser-inserted script の実行中に `document.write()` が呼ばれた場合は、実行中の parser と同じ tokenizer、tree builder、および insertion point に入力を戻してから parse を再開する必要がある。
`write()` の入力を `close()` まで蓄積して一括 parse すると、script 実行時に観測できる DOM と後続 markup の処理順序が変わる。

一方、document parser に JavaScript engine、resource loading、または Window lifecycle を直接持ち込むと、ADR-0030、ADR-0032、ADR-0046、および ADR-0047 が定める package 境界を崩す。
dynamic markup insertion の parser state と scripting capability の接続方法を定める必要がある。

## 決定

### Document parser session

- `@palim/core` に、Document に関連付けられる engine 非依存の document parser session を置く
- session は tokenizer、tree builder、insertion point、および open・writable・closed の状態を保持する
- `Document.open()` は対象 Document の内容を置換し、新しい session を開始する
- `Document.write()` と `Document.writeln()` は active session の入力へ追加し、`Document.close()` は EOF を与えて session を完了させる
- active session がない場合を含む各 API の条件と結果は HTML Standard の dynamic markup insertion に従う
- fragment 用 streaming parser を Document の session として流用しない
- `close()` まで入力を蓄積して一括 parse する経路を作らない

### package 間の接続

- `@palim/core` は parser state と DOM mutation を所有し、Window、resource loader、および JavaScript engine に依存しない
- `@palim/window` の document loader は session と document loading、resource loading、iframe、および load lifecycle を接続する
- `@palim/scripting` は既存の script processing 境界を通じて parser-inserted script を実行し、page script からの `document.write()` を同じ active session へ戻す
- scripting disabled の Document でも dynamic markup insertion は利用できるが、script は実行しない
- page realm binding は Web IDL 変換と method の公開を担当し、parser state を保持しない

### parser の停止と再入

- parser-inserted script の処理中も active session と insertion point を保持する
- script 実行中の `document.write()` は active session に同期的に入力を追加し、script 処理後に同じ parser が追加された入力から処理を再開する
- external parser-blocking script の取得中は session を保持し、取得と実行の完了後に同じ parser を再開する
- session の完了、pending resource、pending script、および load event の順序は document loader が調整する

## 影響

- parser-inserted script、custom element construction、および後続 markup が同じ Document と parser state を観測できる
- parser-only の利用は JavaScript engine と Window package に依存しないまま維持される
- Document implementation に長寿命の parser state と lifecycle が追加される
- core、window、および scripting をまたぐ session、再入、resource、iframe、および load event の検証が必要になる

## 代替案

### `write()` の入力を `close()` まで蓄積する

途中の DOM、parser-inserted script、および `document.write()` の再入を観測できず、document parser の処理順序が変わるため採用しない。

### fragment 用 streaming parser を使用する

fragment context への挿入と Document の置換では tree builder の初期状態、insertion point、および lifecycle が異なるため採用しない。

### dynamic markup insertion を scripting package に実装する

scripting disabled の Document で API を利用できず、parser state と DOM mutation が JavaScript engine capability に依存するため採用しない。

### page realm binding だけに method を追加する

binding の外に parser session が存在せず、Window を持たない Document と page realm の Document で実装が分岐するため採用しない。

## 参考資料

- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0030](./0030-script-element-classic-script-execution.md)
- [ADR-0032](./0032-parser-inserted-external-classic-script.md)
- [ADR-0035](./0035-wpt-document-resource-loading.md)
- [ADR-0046](./0046-multi-package-capability-boundaries.md)
- [ADR-0047](./0047-window-scripting-separation.md)
- [WHATWG HTML: Dynamic markup insertion](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html)
