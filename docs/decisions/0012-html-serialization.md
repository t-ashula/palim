# ADR-0012: HTML serialization の追加

## ステータス

accepted

## コンテキスト

palim は HTML parsing によって DOM tree を構築でき、`innerHTML` と `outerHTML` の setter を提供しているが、DOM tree を HTML として読み出す経路を持たない。

HTML document の element を文字列として読み出せるようにするため、HTML serialization を追加する。公開 API の範囲と内部処理の境界を決める必要がある。

## 決定

- 複数の getter が使用する serialization 処理を内部で共有し、palim 固有の serialization API は公開しない
- XML document の serialization、`XMLSerializer`、Shadow DOM を含む serialization は対象外とする
- serialization の test は公開 getter を通して実行し、内部処理を直接呼び出さない

## 影響

- serialization の内部処理を公開 API として維持する必要がない
- XML serialization と Shadow DOM を含む serialization には別の設計判断が必要になる

## 代替案

### palim 固有の `serializeHTML()` を公開する

標準 DOM API と役割が重複し、利用者が Web platform にはない API を選ぶ必要が生じるため採用しない。

### XML serialization を同時に実装する

HTML document と XML document では使用する serialization algorithm が異なるため採用しない。

## 参考資料

- [ADR-0009](./0009-context-element-fragment-parsing.md)
- [WHATWG HTML: Serializing HTML fragments](https://html.spec.whatwg.org/multipage/parsing.html#serialising-html-fragments)
- [WHATWG HTML: The innerHTML and outerHTML properties](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#the-innerhtml-property)
