# ADR-0007 Design log: HTML element interface の追加

## 目的

HTML parser が生成する要素へ WHATWG HTML の element interface を導入するため、準拠対象、対象 interface、既存 DOM との接続、実装順序、および検証方法を整理する。palim としての判断は ADR-0007 に置く。

## 現状

`src/html/parser.ts` は namespace を決定した後、すべての要素を `new Element(document, localName, namespace)` で生成する。

現在の tree には次の性質がある。

- HTML、SVG、MathML の要素が同じ `Element` class の instance になる
- namespace と local name は保持される
- HTML 要素の tag name は ASCII uppercase になる
- selector matching は namespace を参照できる
- HTML element interface は存在しない
- `template` の template contents など、element 固有 interface から公開される状態の一部は内部にだけ保持される

HTML parser の tree construction は要素の挿入位置と namespace を決定できている。HTML namespace で要素を生成するときに、local name から対応する interface を選ぶ層が必要になる。

## 準拠対象

| 対象 | 規範仕様 | 範囲 |
| --- | --- | --- |
| HTML element interface | WHATWG HTML | HTML element に対応する interface、継承関係、member、mixin |
| element interface の決定 | WHATWG HTML 3.2.2 Elements in the DOM | local name、旧要素名、custom element name、unknown element の分類 |
| 基底 DOM interface | WHATWG DOM | `Node`、`Element`、collection、attribute、tree mutation |
| ECMAScript binding | Web IDL | argument conversion、property、exception、interface object |
| interface member の依存仕様 | URL、Fetch、Canvas、Encoding、File API など | HTML element interface の member が参照する範囲 |

WPT は仕様上の検証観点を調べる資料として参照し、仕様の代わりにはしない。

## 対象 interface

対象は WHATWG HTML の element index で HTML element に割り当てられたすべての interface と、その共通基底および中間基底である。

これには少なくとも次の分類が含まれる。

- `HTMLElement` と `HTMLUnknownElement`
- document structure と metadata の interface
- section、grouping content、text-level semantics の interface
- link と navigation に関する interface
- embedded content、image、media、track、map の interface
- table の interface
- form、form control、label、option の interface
- interactive element の interface
- script、template、slot、canvas の interface
- obsolete element に対応する interface と obsolete member

`HTMLMediaElement` のように複数の element interface の基底となる interface も対象に含める。`HTMLElement` が include する interface mixin の member も対象に含める。

interface の一覧を palim 独自の固定リストとして定義せず、対象とする WHATWG HTML revision の element interface index と Web IDL を確認して更新する。

## Element interface の決定

HTML Standard は HTML namespace の local name から element interface を決定する。

- 標準の要素型に固有 interface が定義されている場合は、その interface を使用する
- 固有 interface を持たない標準要素は `HTMLElement` を使用する
- 仕様が個別に定める旧要素名は、指定された interface を使用する
- valid custom element name は `HTMLElement` を使用する
- いずれにも該当しない名前は `HTMLUnknownElement` を使用する

`listing` と `xmp` が `HTMLPreElement` を使用することも、この決定手順に含まれる。これは parser の tokenization や tree construction の特例ではなく、作成した element の runtime interface に関する規則である。

SVG namespace と MathML namespace の要素は HTML element interface の対象ではない。

## Interface の完全性

interface class を追加するだけでは、その interface の実装完了とは扱わない。各 interface について次を揃える。

- 標準の継承関係
- Web IDL に現れる attribute、operation、constant、indexed property、named property
- include される interface mixin
- content attribute の reflection
- getter と setter の algorithm
- argument と返り値の Web IDL conversion
- 仕様が定める exception
- live collection と static collection の区別
- owner document、tree、form owner、browsing context などへの接続

未実装 member を独自の既定値で埋めたり、呼び出しだけ成功させたりしない。依存機能が未実装の場合は、その依存機能を先に実装する。

## Element factory

HTML namespace の element interface 選択を tree builder から分離する。

factory は少なくとも次を入力に取る。

- owner document
- local name
- namespace
- prefix

HTML namespace の場合は local name に対応する element interface の instance を生成する。SVG、MathML、およびその他の namespace は、それぞれの実装範囲に応じた element を生成する。

tree builder は token と insertion mode から namespace と local name を決め、factory が返した element へ attribute を設定する。element 固有 interface を追加しても tree construction の分岐は増やさない。

## 既存 DOM との接続

HTML element interface の member を実装するには、現在内部処理だけが持つ次の機能を標準 DOM API として整備する必要がある。

- attribute の取得、追加、置換、削除
- node の追加、挿入、置換、削除
- text content の更新
- live collection
- document と tree の connected state
- event target と event handler
- focus と activation

element 固有 interface によって、さらに次の状態と処理が必要になる。

- URL の解析と相対 URL の解決
- form owner、form control state、validation、submission
- table row と cell の collection および mutation
- template contents
- media resource と playback state
- canvas rendering context
- browsing context と navigation

これらは HTML element interface の member が参照する範囲で実装し、同名の独自 API へ置き換えない。

## 実装順序

実装は依存関係に従って複数の変更へ分ける。順序は実装量を減らすためではなく、各変更を仕様と test に対応付けて検証できるようにするために使う。

1. `Element` の attribute API と node mutation
2. `HTMLElement`、共通 mixin、および element factory
3. document structure、metadata、grouping content、text-level semantics
4. template、script、interactive element
5. table
6. form と form control
7. embedded content、image、map
8. media と track
9. canvas
10. obsolete member と残りの interface

依存関係によって順序は変更できる。途中の変更で未実装 interface を実装済みとして export したり、対応する固有 interface を `HTMLElement` で代替したりしない。

## 公開範囲

実装した HTML element interface は package root から export する。interface 選択用 factory と local name の対応表は公開しない。

constructor の公開方法と Web IDL の HTML constructor semantics は、browser realm を持たない現在の package API で同じ挙動を提供できるかを各 interface の実装前に確認する。TypeScript class の都合だけで標準にない constructor signature を公開しない。

## Test

仕様から project test を先に作成し、その後に実装を接続する。test tree は公開 API で構築し、`_append`、`_setAttributes` などの内部 member は使用しない。

### Project test

interface ごとに少なくとも次を検証する。

- parser が local name に対応する runtime class を生成すること
- 標準の inheritance と `instanceof`
- own member と inherited member
- getter、setter、operation、constant
- content attribute reflection
- Web IDL conversion と exception
- owner document、ancestor、descendant、sibling との接続
- HTML、SVG、MathML namespace の区別
- unknown element と valid custom element name
- package root の export

project test 内で実行対象を環境や実装結果に応じて選別しない。未実装 interface や member を test から除外して合格扱いにしない。

### WPT の参照

主な調査対象は次のとおりである。

- `interfaces/html.idl`
- `html/dom/`
- `html/dom/elements/`
- `html/semantics/`
- `dom/nodes/`

WPT の IDL harness と HTML element test は、browser global、interface object、DOM mutation、event、custom elements、browsing context、および element ごとの依存 API を前提とする。

palim が test file の実行条件を満たすまでは、WPT を直接実行しない。WPT case を palim 向けに変換した結果も WPT の実行結果として扱わない。

## 計測

project test の合格数を仕様全体に対する適合率とは扱わない。HTML element interface の外部コーパスによる適合度計測は、WPT を実行できる API と環境、および ADR-0002 への結果接続を決めた後に追加する。

実装状況を示す場合は、対象 interface、member、および依存機能の一覧に対する状態として記録し、実装済み項目だけを母数にしない。

## 完了条件

ADR-0007 の実装完了には次を必要とする。

- 対象 revision の element interface がすべて存在する
- すべての HTML local name が対応する interface へ割り当てられる
- 各 interface の IDL member と include される mixin が実装される
- Web IDL conversion と exception が実装される
- interface と member の project test が通る
- 未実装 interface を `HTMLElement` で代替していない
- 未実装 member を独自の挙動で代替していない

## 参考資料

- [ADR-0007](../decisions/0007-html-element-interfaces.md)
- [ADR-0005](../decisions/0005-dom-parser.md)
- [ADR-0006](../decisions/0006-selector-api.md)
- [WHATWG HTML: Elements in the DOM](https://html.spec.whatwg.org/multipage/dom.html#elements-in-the-dom)
- [WHATWG HTML: Element interfaces](https://html.spec.whatwg.org/multipage/indices.html#element-interfaces)
- [WHATWG HTML: All interfaces](https://html.spec.whatwg.org/multipage/indices.html#all-interfaces)
- [WHATWG DOM: Element](https://dom.spec.whatwg.org/#interface-element)
- [Web IDL](https://webidl.spec.whatwg.org/)
- [WPT: HTML Web IDL](https://github.com/web-platform-tests/wpt/blob/master/interfaces/html.idl)
- [WPT: HTML elements](https://github.com/web-platform-tests/wpt/tree/master/html/dom/elements)
