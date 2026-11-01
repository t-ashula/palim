# ADR-0023: XMLSerializer と XML serialization の共有

## ステータス

accepted

## コンテキスト

palim は XML document の `innerHTML` と `outerHTML` で使用する XML serialization を内部に持つが、`XMLSerializer` を公開していない。

現在の XML serialization は element とその child nodes を入口としており、任意の `Node` を入口にする `XMLSerializer.serializeToString()` から共有できる構成になっていない。
公開 API の追加に際して、既存の markup getter と新しい API の処理が分岐しない構成を決める必要がある。

## 決定

- `XMLSerializer` constructor を package export に追加する
- `XMLSerializer.serializeToString()` と XML document の markup getter は、任意の `Node` を入口にできる一つの XML serialization 処理を共有する
- XML serialization 処理は内部 module に置き、palim 固有の serialization 関数として package export しない
- project test は公開された `XMLSerializer` と既存の markup getter を使用し、内部 serialization 関数を直接使用しない
- project test の期待結果は WHATWG HTML の XML serialization algorithm と XML Namespaces の規則を根拠にする

## 影響

- XML serialization の修正が `XMLSerializer` と markup getter の両方へ反映される
- `Window` 導入前は package export が `XMLSerializer` の生成経路になる
- 既存の XML serialization 処理を、すべての `Node` type と serialization error を扱える形へ拡張する必要がある

## 代替案

### XMLSerializer 専用の serialization 処理を追加する

markup getter と同じ XML serialization 規則を二重に実装することになるため採用しない。

### XMLSerializer の代わりに serialization 関数を公開する

Web platform にない palim 固有 API になるため採用しない。

## 参考資料

- [ADR-0012](./0012-html-serialization.md)
- [ADR-0013](./0013-xml-parsing.md)
- [WHATWG HTML: The XMLSerializer interface](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#the-xmlserializer-interface)
- [WHATWG HTML: Serializing XML fragments](https://html.spec.whatwg.org/multipage/xhtml.html#serialising-xhtml-fragments)
- [Namespaces in XML](https://www.w3.org/TR/xml-names/)
