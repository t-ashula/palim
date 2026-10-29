# ADR-0005 Design log: DOMParser の追加

## 目的

DOMParser の実装に先立ち、準拠対象、公開 API、初期実装の機能制限、test、および計測方法を整理する。設計判断は ADR-0005 に置く。

## 準拠対象

準拠判断では次の Living Standard を規範とする。

| 対象 | 規範仕様 | 範囲 |
| --- | --- | --- |
| `DOMParser` | WHATWG HTML 8.5.1 The `DOMParser` interface | constructor、`parseFromString()` の `text/html` branch |
| HTML parsing | WHATWG HTML 13.2 Parsing HTML documents | input preprocessing、tokenization、tree construction、parse error recovery |
| DOM tree | WHATWG DOM 4 Nodes | node tree と初期 API で公開する interface |

WPT と html5lib tests は準拠を検証する test data として使用し、仕様の代わりにはしない。外部 fixture は ADR-0002 に従って commit SHA で固定する。

### DOMParser

`parseFromString(input, "text/html")` は、呼び出しごとに新しい `Document` を返す。

返される document の content type は `text/html`、encoding は UTF-8 とする。document は browsing context を持たず、scripting は無効とする。入力中の XML declaration や `meta` element による encoding 指定は結果へ影響しない。

### HTML parsing

WHATWG HTML 13.2 のうち、JavaScript string から HTML document を構築する処理を対象とする。

- input stream preprocessing
- tokenization
- tree construction
- parse error からの recovery
- `html`、`head`、`body` element の補完
- HTML、SVG、MathML namespace の node と attribute の生成

byte stream からの encoding detection と、解析中の encoding 変更は対象外とする。

### DOM

HTML parser が tree を構築し、利用者が parse result を参照するために必要な範囲を対象とする。

- `Node`
- `Document`
- `DocumentType`
- `Element`
- `Attr`
- `CharacterData`
- `Text`
- `Comment`
- `NodeList`
- `HTMLCollection`
- `NamedNodeMap`

## 公開 API

package root から `DOMParser` と、返り値の型として必要な DOM interface を export する。

```ts
interface DOMParser {
  parseFromString(input: string, type: "text/html"): Document;
}
```

初期実装で公開する DOM member は次の範囲とする。

| Interface | Member |
| --- | --- |
| `Node` | `nodeType`、`nodeName`、`ownerDocument`、`parentNode`、`parentElement`、`childNodes`、`firstChild`、`lastChild`、`previousSibling`、`nextSibling`、`textContent` |
| `Document` | `doctype`、`documentElement`、`head`、`body`、`contentType`、`characterSet`、`compatMode` |
| `DocumentType` | `name`、`publicId`、`systemId` |
| `Element` | `namespaceURI`、`prefix`、`localName`、`tagName`、`attributes`、`children`、`firstElementChild`、`lastElementChild`、`childElementCount` |
| `Attr` | `namespaceURI`、`prefix`、`localName`、`name`、`value`、`ownerElement` |
| `CharacterData` | `data`、`length` |
| `NodeList` | `length`、`item()`、index access |
| `HTMLCollection` | `length`、`item()`、index access |
| `NamedNodeMap` | `length`、`item()`、index access |

同名の標準 interface と異なる意味や返り値を持つ独自 member は追加しない。collection の順序、live 性、nullability は DOM Standard に従う。

## 機能制限

初期実装では次を提供しない。

- `text/xml`、`application/xml`、`application/xhtml+xml`、`image/svg+xml` の parsing
- byte input、encoding detection、streaming input
- `Window` と browsing context
- script execution、event handler、custom element reaction
- network access と subresource fetch
- DOM mutation、event、range、traversal、mutation observer
- shadow DOM、style、layout、serialization
- HTML element ごとの `HTMLElement` subclass
- Trusted Types と browser realm に依存する処理

script element と event handler content attribute は sanitization せず tree に保持する。parse result で scripting が無効であることと、入力が安全であることは区別する。

## Test

### Project test

project 内の test では、公開 API と代表的な parsing 動作の回帰を確認する。

- constructor と `text/html` の扱い
- 呼び出しごとに新しい `Document` を返すこと
- `contentType`、`characterSet`、doctype、`compatMode`
- `html`、`head`、`body` element の補完
- element、attribute、text、comment、doctype の tree 構築
- character reference、RCDATA、RAWTEXT、script data
- table、template、foreign content、misnested formatting element
- malformed input の error recovery
- node navigation と collection
- script と event handler が実行されないこと
- 初期実装の対象外とした MIME type の扱い

project 内の test は代表 case と palim 固有の regression を対象とし、外部 fixture の case を転記しない。

### External test

外部 test は ADR-0002 の取得、実行、status、記録方法に従う。

- html5lib tokenizer tests で tokenization を検証する
- WPT の HTML syntax parsing resources で tree construction を検証する
- WPT の DOMParser test のうち `text/html` と初期 DOM API で実行できる case を検証する
- WPT の DOM test のうち初期 DOM API に対応する case を検証する

browser global、XML parser、または対象外の DOM API を必要とする case は、理由を付けて `unsupported` として記録する。

tree construction は、fixture が定める canonical tree と直接比較する。HTML serialization を介した比較は行わない。

## 計測

### 仕様準拠度

DOMParser API、tokenization、tree construction、DOM API を分けて集計する。status と report 形式は ADR-0002 に従う。

未実装の case を母数から除外しない。report には対象仕様、外部 fixture revision、初期 API の範囲、機能制限を記録する。

### 速度

速度計測は ADR-0003 に従う。

Warm parse は module import と入力準備の完了後に開始し、`parseFromString()` が `Document` を返した時点で終了する。node 数や tree hash による結果検証は計測区間の外で行う。

Cold start と End to end は既存の定義を適用する。初期 API は string 全体を入力とするため、Streaming は計測しない。

### メモリ

メモリ計測は ADR-0004 に従う。

入力 string と返された `Document` を保持した状態で Peak RSS、Incremental Peak RSS、retained memory を取得する。入力 bytes、node 数、attribute 数を記録し、memory amplification と bytes per node を算出する。

baseline process は同じ module import と入力準備を行い、`parseFromString()` を呼び出さない。解放後の retained memory を測る場合は、parser と result document の両方を参照から外す。

## 未決事項

- HTML element subclass を追加する単位
- WPT の browser harness に依存する test の実行方法
- XML parser と namespace model を追加する単位

## 参考資料

- [ADR-0005](../decisions/0005-dom-parser.md)
- [WHATWG HTML: The DOMParser interface](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#the-domparser-interface)
- [WHATWG HTML: Parsing HTML documents](https://html.spec.whatwg.org/multipage/parsing.html#parsing)
- [WHATWG DOM: Nodes](https://dom.spec.whatwg.org/#nodes)
- [html5lib tests](https://github.com/html5lib/html5lib-tests)
- [Web Platform Tests](https://github.com/web-platform-tests/wpt)
