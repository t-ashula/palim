# ADR-0010: HTML parse error の保持と取得

## ステータス

accepted

## コンテキスト

HTML Standard は、不正な HTML に対する recovery を含めて parsing algorithm を定義している。
algorithm 中の一部の条件は parse error とされるが、`DOMParser.parseFromString(input, "text/html")` が返す `Document` から parse error を取得する標準 API はない。

html5lib の tree construction fixture には期待する parse error が含まれている。
palim でこの情報を検証可能にするには、tokenization と tree construction で発生した parse error を解析結果と対応付けて保持する必要がある。

parse error を `DOMParser` に保持すると、直前の呼び出しにしか対応できず、`DOMParser` 以外の経路で生成した `Document` から取得できない。
標準の DOM interface を変更せず、生成経路によらず parse error を取得できる方法を決める必要がある。

## 決定

- HTML document parsing で発生した parse error は、解析結果の `Document` 内部に palim 固有の形式で保持する
- parse error の保持領域は DOM の公開 interface に含めず、`Document` に property、event、または callback を追加しない
- palim は `Document` を受け取って、その内部に保持された parse error を返す `parseErrors(document)` API を提供する
- `parseErrors(document)` は、対象の `Document` を生成した HTML document parsing で発生した tokenization と tree construction の parse error を対象とする
- parse error の取得方法は、`Document` が `DOMParser`、文字列、URL のいずれを入力とする経路から生成されたかに依存させない
- parse error は HTML parser の recovery を変更せず、parse error が存在しても解析 API は通常どおり `Document` を返す
- fragment parsing は結果として `Document` を生成しないため、この API の対象外とする
- parse error の内部表現と公開する情報は palim 固有とし、DOM または HTML Standard の interface として扱わない
- `parseErrors(document)` が返すエラーの内容と表現は、外部仕様、外部 fixture、または他の parser 実装との厳密な一致を要件としない
- 外部 fixture を使用する場合は、fixture が定義する parse error の発生有無または件数を検証し、エラー表現そのものは比較しない

## 影響

- parse error は parser instance の直前の状態ではなく、対応する解析結果から取得できる
- 複数の `Document` を生成した場合も、それぞれの parse error を区別できる
- `DOMParser` 以外に HTML から `Document` を生成する API を追加しても、同じ取得 API を使用できる
- html5lib の tree construction fixture に含まれる expected error の件数を、公開 DOM interface を変更せずに比較できる
- palim のエラー表現を外部 parser の error code、message、または位置表現に合わせ続ける必要がない
- parse error を保持するため、解析結果の `Document` ごとに追加のメモリを使用する
- `innerHTML`、`outerHTML`、`insertAdjacentHTML()` などの fragment parsing で発生した parse error を取得する場合は、別の取得方法を決定する必要がある

## 代替案

### `DOMParser` に直前の parse error を保持する

複数回呼び出した場合に以前の結果との対応が失われ、`DOMParser` 以外の生成経路にも適用できないため採用しない。

### `Document` に公開 property を追加する

標準の DOM interface に palim 固有の member が混在するため採用しない。

### parse result と parse error を wrapper object で返す

`DOMParser.parseFromString()` の標準の返り値を維持できず、生成経路ごとに異なる API が必要になるため採用しない。

### parse error で例外を送出する

不正な HTML から recovery して tree を返す HTML parsing の動作と異なるため採用しない。

## 参考資料

- [ADR-0005](./0005-dom-parser.md)
- [ADR-0008](./0008-tree-construction-conformance-tests.md)
- [WHATWG HTML: Parse errors](https://html.spec.whatwg.org/multipage/parsing.html#parse-errors)
- [WHATWG HTML: The DOMParser interface](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#the-domparser-interface)
