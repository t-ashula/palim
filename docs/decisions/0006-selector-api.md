# ADR-0006: Selector API の追加

## ステータス

accepted

## コンテキスト

ADR-0005 で追加した DOM tree は、node navigation を使って参照できるが、CSS selector による検索 API を持たない。

HTML parser の利用者が parse result から目的の element を検索できるようにするため、標準の Selector API を追加する。
公開 API の範囲、準拠対象、selector の構文解析と matching、HTML 固有の比較規則、および検証方法を決める必要がある。

## 決定

- `Document`、`DocumentFragment`、`Element` に `querySelector()` と `querySelectorAll()` を追加する
- `Element` に `matches()` と `closest()` を追加する
- 準拠対象を WHATWG DOM、Selectors Level 4、CSS Syntax Level 3、WHATWG HTML、Web IDL とする
- 4つの公開 API で CSS tokenizer、selector parser、matcher を共有する
- project test を実装に先行して追加し、公開 API、scope、matching、返り値、例外、HTML 固有の規則を検証する
- WPT は検証観点と期待動作を調査する資料として参照し、test suite として実行または計測しない
- WPT の実行を目的とした browser 相当の API は追加しない

## 影響

- CSS tokenization、selector parsing、matching の実装が必要になる
- `Document`、`DocumentFragment`、`Element` に共通する `ParentNode` の処理が必要になる
- 静的な `NodeList` と `DOMException` が必要になる
- attribute と document mode を selector matching から参照する処理が必要になる
- 初期実装の適合性は、仕様から作成した project test で検証することになる
- WPT の直接実行結果を Selector API の初期実装について提示することはできない
- `querySelector()`、`querySelectorAll()`、`matches()`、`closest()` で同じ構文解析と matching を再利用できる

## 代替案

### 単純な selector だけを受理する独自 parser を追加する

CSS escape、selector list、pseudo-class、構文エラーの扱いが標準と異なり、有効な selector と不正な selector を区別できなくなるため採用しない。

### `querySelector()` だけを追加する

同じ構文解析と matching に対して検索結果の個数だけが異なり、標準 API の一部を省く利点が小さいため採用しない。

### WPT を palim 用の test case に変換する

upstream test との対応関係と実行条件が失われやすく、変換後の test を WPT の実行結果として扱えないため採用しない。project test は仕様から作成し、WPT は検証観点の調査資料として参照する。

## 参考資料

- [Design log](../design-log/0006-selector-api.md)
- [ADR-0002](./0002-compliance-measurement.md)
- [ADR-0005](./0005-dom-parser.md)
- [WHATWG DOM: ParentNode](https://dom.spec.whatwg.org/#parentnode)
- [Selectors Level 4](https://drafts.csswg.org/selectors/)
- [CSS Syntax Level 3](https://drafts.csswg.org/css-syntax-3/)
- [WHATWG HTML: Case-sensitivity of selectors](https://html.spec.whatwg.org/multipage/semantics-other.html#case-sensitivity-of-selectors)
- [Web IDL: ECMAScript binding](https://webidl.spec.whatwg.org/#es-operations)
- [Web Platform Tests](https://github.com/web-platform-tests/wpt)
