# ADR-0006 Design log: Selector API の追加

## 目的

Selector API の実装に先立ち、準拠対象、公開 API、selector の構文解析と matching、既存 DOM との接続、および検証方法を整理する。設計判断は ADR-0006 に置く。

## 調査時点の状態

palim は `DOMParser` が返す tree に対して、`Node` の navigation と `Element.children` などの collection を提供している。

Selector API に必要な次の機能は存在しない。

- `querySelector()` と `querySelectorAll()`
- CSS tokenizer
- selector parser と selector の内部表現
- selector matcher
- `DOMException`
- Web IDL に相当する引数変換
- 静的な `NodeList` を明示的に構築する処理

`Element.attributes` と tree navigation は matching の入力として利用できる。現在の `NodeList` は callback から内容を取得するため、検索時点の結果を保持する静的 collection と live collection を区別する必要がある。

## 準拠対象

| 対象 | 規範仕様 | 範囲 |
| --- | --- | --- |
| 公開 API | WHATWG DOM `ParentNode`、`Element` | `querySelector()`、`querySelectorAll()`、`matches()`、`closest()` |
| scope | WHATWG DOM scope-match a selectors string | `Document`、`DocumentFragment`、`Element` を scoping root とする検索 |
| 構文と matching | Selectors Level 4 | selector list、complex selector、compound selector、simple selector、pseudo-class |
| tokenization | CSS Syntax Level 3 | identifier、escape、string、comment、whitespace、token |
| HTML integration | WHATWG HTML | HTML document での element、attribute、ID、class、列挙属性の比較規則 |
| JavaScript binding | Web IDL | `DOMString` 変換、必須引数、余分な引数、例外伝播 |

WPT は仕様上の検証観点と期待動作を調べる資料として参照し、仕様の代わりにはしない。初期実装では WPT を test suite として実行しない。

## 公開 API

初期実装では次の member を追加する。

| Interface | Member | 結果 |
| --- | --- | --- |
| `Document` | `querySelector(selectors)` | 最初に一致した `Element` または `null` |
| `Document` | `querySelectorAll(selectors)` | 一致した `Element` の静的な `NodeList` |
| `DocumentFragment` | `querySelector(selectors)` | 最初に一致した `Element` または `null` |
| `DocumentFragment` | `querySelectorAll(selectors)` | 一致した `Element` の静的な `NodeList` |
| `Element` | `querySelector(selectors)` | 最初に一致した `Element` または `null` |
| `Element` | `querySelectorAll(selectors)` | 一致した `Element` の静的な `NodeList` |
| `Element` | `matches(selectors)` | 対象の element が一致するかを示す `boolean` |
| `Element` | `closest(selectors)` | 最も近い一致した `Element` または `null` |

`querySelectorAll()` は呼び出しごとに新しい `NodeList` を返す。

4つの API は同じ selector parser と matcher を使用する。

## API の呼び出し規則

引数は Web IDL の `DOMString` として扱う。

- 引数を渡さない呼び出しは `TypeError` とする
- `undefined` と `null` を含む値は Web IDL と ECMAScript の規則で文字列へ変換する
- object の文字列変換で発生した例外はそのまま伝播させる
- 余分な引数は無視する
- selector の構文解析に失敗した場合は、name が `SyntaxError` の `DOMException` を送出する
- 構文として有効だが一致する element がない場合は、API ごとに `null`、空の `NodeList`、または `false` を返す

構文エラー、有効だが非一致、実装されていない有効な selector を同じ結果にまとめない。

## Selector parsing

Selector API は CSS text を入力とするため、selector grammar より先に CSS Syntax の tokenization が必要になる。

少なくとも次の構文を区別して解析する。

- type selector と universal selector
- ID selector と class selector
- attribute selector と各 matching operator
- selector list
- descendant、child、next-sibling、subsequent-sibling combinator
- CSS escape と non-ASCII identifier
- tree-structural pseudo-class
- logical combination pseudo-class
- `:scope`
- pseudo-element

通常の selector list は、一部に不正な selector が含まれる場合に全体を構文エラーとする。`:is()` と `:where()` など forgiving selector list を取る構文は、通常の selector list と分けて解析する。

pseudo-element は構文上の認識と、Element を返す API の検索結果に含まれないことを区別する。未知または不正な構文を単なる非一致として処理しない。

正規表現による文字列分割だけでは escape、comment、string、括弧内の selector list を一貫して処理できないため、CSS token stream と selector の内部表現を分離する。

## Matching と scope

`querySelector()` と `querySelectorAll()` は、呼び出し元 node を scoping root として DOM の scope-match a selectors string を実行する。

`matches()` は対象の element を matching する。`closest()` は対象の element から inclusive ancestor の順に matching する。

matching では次を扱う。

- tree order による結果順序
- complex selector の combinator
- compound selector 内の全条件
- element、attribute、ID、class の値
- sibling と ancestor の関係
- `:scope` と scoping root
- child index と type index
- selector list の重複を除いた結果

matcher は selector ごとの tree walk を公開 API に埋め込まず、解析済み selector と candidate element を評価する処理として分離する。`querySelector()` は最初の一致で終了でき、`querySelectorAll()` は全一致を検索時点の順序で保持する。`matches()` は対象の element を評価し、`closest()` は最初に一致した inclusive ancestor で終了する。

## HTML integration

HTML document では Selectors の一般規則に加えて WHATWG HTML の比較規則を適用する。

- HTML element の type selector
- HTML element 上の namespace を持たない attribute 名
- ID と class
- HTML が定義する列挙属性の値
- document mode に依存する比較

attribute selector の明示的な `i`、`s` flag と、HTML が属性ごとに定める既定の比較規則を区別する。HTML 文書の規則をすべての namespace の element に適用しない。

UI state、form control state、link history、language、directionality など host language の状態を必要とする pseudo-class は、構文の妥当性と matching に必要な状態を分けて扱う。状態を提供できないことを selector の構文エラーにはしない。

## 実装境界

Selector API の実装には次の内部機能が必要になる。

1. CSS tokenizer
2. selector parser と内部表現
3. selector matcher
4. `Document`、`DocumentFragment`、`Element` から利用する共通の検索処理
5. namespace と local name を考慮した attribute lookup
6. HTML document と document mode の参照
7. 静的な `NodeList`
8. `DOMException`
9. Web IDL に相当する公開 API 境界

公開の attribute mutation API や node mutation API は、selector matching 自体の必須条件ではない。一方、WPT が test tree を構築して結果を識別する際には、これらの API が必要になる。

## Test

実装前に仕様から project test を作成し、その後に実装を接続する。WPT は project test の実行基盤として使用しない。

### Project test

project test は、現在の公開 API で構築できる HTML document と、追加する Selector API の動作を検証する。

#### 公開 API

- `Document`、`DocumentFragment`、`Element` に `querySelector()` と `querySelectorAll()` が存在すること
- `Element` に `matches()` と `closest()` が存在すること
- 最初の一致と一致なし
- 複数の一致と tree order
- `querySelectorAll()` が静的な `NodeList` を返すこと
- 呼び出しごとに異なる `NodeList` を返すこと
- selector list による結果の重複がないこと
- `matches()` の一致と非一致
- `closest()` の対象 element、ancestor、一致なし

#### 引数と例外

- 必須引数を省略した場合の `TypeError`
- `undefined`、`null`、number、object の文字列変換
- 文字列変換時の side effect と例外
- 余分な引数
- 不正な selector に対する `DOMException` と `SyntaxError` name
- 有効だが非一致の selector との区別

#### Parsing と matching

- type、universal、ID、class selector
- attribute selector の presence、operator、flag
- selector list
- 各 combinator
- escape、string、comment、whitespace、non-ASCII identifier
- structural pseudo-class
- `:not()`、`:is()`、`:where()`、`:has()`
- `:scope`
- pseudo-element
- 不正な selector list と forgiving selector list

#### Context

- `Document`、`DocumentFragment`、`Element` ごとの scoping root
- ancestor、sibling、child の関係
- HTML、SVG、MathML namespace
- HTML element 名と attribute 名の比較
- ID、class、列挙属性の比較
- document mode

project test は代表的な仕様動作と palim 固有の regression を対象とし、WPT の test case を転記しない。test code 内で実行する case を選別しない。

### WPT の参照

主な調査対象は次の path である。

- `css/selectors/parsing/`
- `css/css-syntax/`
- `dom/nodes/ParentNode-querySelector-All.js`
- `dom/nodes/selectors.js`
- `dom/nodes/ParentNode-querySelector-argument-stringification.html`
- `dom/nodes/ParentNode-querySelector-All-scope.html`
- `dom/nodes/DocumentFragment-querySelectorAll-after-modification.html`
- `dom/nodes/Element-matches.js`
- `dom/nodes/Element-closest.html`

WPT には、次の検証観点が含まれる。

- selector の valid、invalid、serialization
- CSS input preprocessing、tokenization、escape、comment、whitespace、EOF
- interface と member の存在
- `NodeList` の型、静的性、呼び出しごとの identity
- 引数の文字列変換
- tree order
- selector の構文エラー
- selector category ごとの matching
- `:scope`

WPT のこれらの test は、次の browser 相当の機能を実行環境に要求する。

- browser global と `testharness.js` の実行環境
- `createElement()` と `createElementNS()`
- node mutation
- `setAttribute()`、`getAttribute()`、`hasAttribute()`
- `getElementById()`
- `defaultView`
- `CSSStyleSheet.insertRule()` と selector serialization
- `CSS.supports()`

現在の palim はこれらの実行環境を提供しない。WPT を実行するためにこれらを追加すると、Selector API の検証を越えて browser 相当の環境を実装することになる。

別の DOM 実装や browser 上で WPT を動かしても、palim の Selector API の検証にはならない。WPT の file や case を palim 向けに変換した場合も、upstream の実行条件を満たさないため、WPT の実行結果として扱わない。

初期実装では、WPT から検証観点を調査したうえで、規範仕様から project test を作成する。WPT の test case 自体は転記しない。

将来、palim 自身の API と実行環境だけで WPT を直接実行できる段階になった場合は、対象 file、実行環境、結果の分類、および ADR-0002 への接続を別の設計判断で定める。

## Project test の検証区分

project test では少なくとも次を分離して検証する。

- API と Web IDL binding
- selector parsing
- selector matching
- scope
- HTML integration
- `NodeList` と例外

reference browser との differential test は原因調査には利用できるが、仕様準拠の判定には使用しない。

## 初期実装の対象外

- XML parser の追加
- shadow DOM を scoping root とする検索
- live `NodeList` としての検索結果
- browser の UI、focus、history、layout に依存する状態の追加
- WPT を実行するためだけの browser API 一式の追加
- ADR-0002 の適合レポートへの WPT の接続

## 未決事項

- UI state や form control state を必要とする pseudo-class の対応時期

## 参考資料

- [ADR-0006](../decisions/0006-selector-api.md)
- [ADR-0002](../decisions/0002-compliance-measurement.md)
- [ADR-0005](../decisions/0005-dom-parser.md)
- [WHATWG DOM: ParentNode](https://dom.spec.whatwg.org/#parentnode)
- [WHATWG DOM: NodeList](https://dom.spec.whatwg.org/#interface-nodelist)
- [Selectors Level 4: Parse a selector](https://drafts.csswg.org/selectors/#parse-selector)
- [Selectors Level 4: Match a selector against a tree](https://drafts.csswg.org/selectors/#match-a-selector-against-a-tree)
- [CSS Syntax Level 3: Tokenization](https://drafts.csswg.org/css-syntax-3/#tokenization)
- [WHATWG HTML: Case-sensitivity of selectors](https://html.spec.whatwg.org/multipage/semantics-other.html#case-sensitivity-of-selectors)
- [Web IDL: ECMAScript binding](https://webidl.spec.whatwg.org/#es-operations)
- [WPT: Selector parsing](https://github.com/web-platform-tests/wpt/tree/master/css/selectors/parsing)
- [WPT: CSS Syntax](https://github.com/web-platform-tests/wpt/tree/master/css/css-syntax)
- [WPT: CSS parsing test common](https://github.com/web-platform-tests/wpt/blob/master/css/support/parsing-testcommon.js)
- [WPT: ParentNode querySelector and querySelectorAll](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/ParentNode-querySelector-All.js)
- [WPT: Shared selector cases](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/selectors.js)
- [WPT: ParentNode argument stringification](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/ParentNode-querySelector-argument-stringification.html)
- [WPT: ParentNode scope](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/ParentNode-querySelector-All-scope.html)
- [WPT: DocumentFragment static result](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/DocumentFragment-querySelectorAll-after-modification.html)
- [WPT: Element matches](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/Element-matches.js)
- [WPT: Element closest](https://github.com/web-platform-tests/wpt/blob/master/dom/nodes/Element-closest.html)
