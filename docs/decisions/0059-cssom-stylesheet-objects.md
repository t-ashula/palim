# ADR-0059: CSSOM stylesheet API の追加

## ステータス

accepted

## コンテキスト

palim は `style` element の text から一部の style rule を読み取り、computed value と CSS box layout に使用している。
一方、page script は `style` element に関連する stylesheet と rule を参照または変更できず、Document と ShadowRoot に適用される stylesheet も列挙できない。

このため、palim が computed value の計算に使用する stylesheet と、page script が CSSOM として観測する stylesheet を同じ state として扱えない。

## 決定

- `style` element に関連する stylesheet と rule を CSSOM として page script へ公開する
- Document と ShadowRoot は、それぞれに適用される stylesheet を tree order で公開する
- stylesheet、rule、および collection は同じ対象に対して identity を維持し、DOM と stylesheet の変更を反映する
- page script による rule の変更を selector matching、cascade、および computed value に反映する
- CSSOM の参照と変更は CSS box layout の実行を必要としない
- WPT の `/css/cssom/` を検証対象へ追加する

## 影響

- page script から stylesheet と rule を参照および変更できる
- DOM tree への追加、除去、および移動によって、公開される stylesheet の内容と順序が変わる
- CSSOM から変更した rule と computed value の計算結果が一致する
- external stylesheet、constructable stylesheet、media query、および CSS animation はこの決定では追加しない
- CSSOM 機能を提供する前は `/css/cssom/` を WPT の検証対象へ追加しない

## 代替案

### 空の stylesheet collection だけを公開する

`style` element の stylesheet と rule を参照できず、DOM tree と collection の内容が一致しないため採用しない。

### stylesheet text を computed value の計算時だけ解析する

page script に stylesheet と rule の参照および変更を提供できないため採用しない。

### CSSOM から変更した rule を cascade に使用しない

同じ stylesheet に対する参照結果と computed value が異なるため採用しない。

## 参考資料

- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0041](./0041-web-idl-realm-binding-boundary.md)
- [ADR-0056](./0056-element-geometry-css-box-layout.md)
- [CSS Object Model](https://drafts.csswg.org/cssom/)
- [HTML: The style element](https://html.spec.whatwg.org/multipage/semantics.html#the-style-element)
