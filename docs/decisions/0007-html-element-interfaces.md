# ADR-0007: HTML element interface の追加

## ステータス

accepted

## コンテキスト

ADR-0005 で追加した HTML parser は、HTML namespace の要素をすべて `Element` として生成する。

このため、parse result の要素が WHATWG HTML で定義された interface を持たず、element ごとの標準 API を利用できない。`HTMLElement` だけを追加して element 固有 interface を省略すると、interface identity、継承関係、および公開 member が仕様と一致しない。

HTML element interface 全体の実装範囲、parser から interface を選択する場所、および検証方法を決める必要がある。

## 決定

- WHATWG HTML Living Standard が HTML element に定めるすべての interface を実装する
- 各 interface について、継承関係、IDL member、interface mixin、および Web IDL の変換と例外を実装する
- HTML namespace の local name と element interface の対応を WHATWG HTML の決定手順に従って実装する
- 実装済みの固有 interface を `HTMLElement` で代替せず、parser result に対応する runtime class を使用する
- parser の tree builder から interface 選択を分離し、HTML element の生成を一つの factory へ集約する
- HTML element interface を package root から公開する
- interface 群は依存関係に従って段階的に実装できるが、すべての対象 interface と member が揃うまで ADR-0007 の実装完了とは扱わない
- project test を各実装単位に先行して追加し、公開 API から interface identity、inheritance、member、および要素名との対応を検証する
- WPT は検証観点を調査する資料として参照し、palim が実行条件を満たさない test を実行結果または適合度の母数として扱わない

## 影響

- HTML parser が生成する要素は、element ごとの標準 interface と API を持つ
- `HTMLElement` が依存する DOM mutation、attribute reflection、event、focus、および content editing の実装が必要になる
- element 固有 interface が依存する URL、form、table、media、canvas、browsing context、および関連 API の実装が必要になる
- SVG と MathML の element interface は HTML element interface と分離して扱う
- Living Standard の interface 変更を追跡し、対象範囲と test を更新する必要がある
- 実装途中では未実装 interface と member が残るが、基底 interface への代替を仕様準拠として扱わない

## 代替案

### `HTMLElement` と `HTMLUnknownElement` だけを追加する

element 固有 interface の identity と member が欠け、HTML element interface を利用する API として不完全になるため採用しない。

### element 固有 interface を空の class として追加する

interface identity だけが存在し、各 interface が定める member を持たない object を公開することになるため採用しない。

### 必要になった element interface だけを追加する

利用した HTML によって標準 interface の有無が変わり、未実装範囲を暗黙に `HTMLElement` へ置き換えることになるため採用しない。

### tree builder の分岐ごとに class を直接選択する

HTML parsing の insertion mode と DOM interface の対応が混在し、同じ local name の生成処理が分散するため採用しない。

## 参考資料

- [Design log](../design-log/0007-html-element-interfaces.md)
- [ADR-0005](./0005-dom-parser.md)
- [ADR-0006](./0006-selector-api.md)
- [WHATWG HTML: Elements in the DOM](https://html.spec.whatwg.org/multipage/dom.html#elements-in-the-dom)
- [WHATWG HTML: Element interfaces](https://html.spec.whatwg.org/multipage/indices.html#element-interfaces)
- [WHATWG HTML: All interfaces](https://html.spec.whatwg.org/multipage/indices.html#all-interfaces)
- [WHATWG DOM: Element](https://dom.spec.whatwg.org/#interface-element)
- [Web IDL](https://webidl.spec.whatwg.org/)
- [WPT: HTML Web IDL](https://github.com/web-platform-tests/wpt/blob/master/interfaces/html.idl)
- [WPT: HTML elements](https://github.com/web-platform-tests/wpt/tree/master/html/dom/elements)
