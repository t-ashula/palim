# ADR-0013: XML parsing の実装境界と適合テスト

## ステータス

accepted

## コンテキスト

palim の `DOMParser` は HTML document だけを構築し、XML、XHTML、および SVG document を構築できない。

XML document を追加するには、HTML parser とは異なる構文規則、namespace 処理、well-formedness error、および既存の markup API との接続が必要になる。
palim が実装する XML processor の範囲、内部処理の境界、および適合テストを決める必要がある。

## 決定

- document parsing と fragment parsing で同じ XML parser core を共有する
- palim の XML processor は non-validating processor とし、外部 entity を取得しない
- 内部 XML parser は公開せず、test は公開 API を通して実行する
- XML document の既存 markup API が使用する XML fragment serialization を同じ実装範囲に含め、`XMLSerializer` interface の追加は含めない
- W3C XML Conformance Test Suite 20130923 を外部 test corpus として使用する
- XML 1.0 Fifth Edition と Namespaces in XML 1.0 Third Edition の case を計測対象とする
- case の期待結果は、外部 entity を読まない non-validating processor に対する W3C test matrix に従う
- XML 1.1 と optional error の case は、理由を付けて分類し、総数に含める
- XML parsing の結果は HTML parsing と分離し、raw result、機械可読レポート、および分類別集計を出力する
- XML parsing error の追加診断文は palim 固有とし、外部 test corpus との比較対象にしない

## 影響

- HTML parser と XML parser の error recovery を混在させずに維持できる
- internal subset、entity、namespace、および XML の node type を処理する必要がある
- W3C XML Conformance Test Suite の manifest と fixture を読み込む test harness が必要になる
- 外部 entity を取得しない processor profile が conformance report に反映される
- XML fragment serialization は公開 API ではなく既存 markup API の内部処理となる

## 代替案

### HTML parser に XML parsing の分岐を追加する

error recovery と well-formedness、name、および namespace の処理が異なる parser を同じ状態機械へ混在させるため採用しない。

### validating XML processor を実装する

DTD validation と外部 resource の処理を初期実装の必須範囲に含めることになるため採用しない。

### project test だけで検証する

XML と namespace の構文全体に対する網羅性と、他の XML processor との比較可能性が不足するため採用しない。

## 参考資料

- [ADR-0002](./0002-compliance-measurement.md)
- [ADR-0009](./0009-context-element-fragment-parsing.md)
- [ADR-0012](./0012-html-serialization.md)
- [WHATWG HTML: The DOMParser interface](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#the-domparser-interface)
- [W3C XML 1.0 Fifth Edition](https://www.w3.org/TR/xml/)
- [W3C Namespaces in XML 1.0 Third Edition](https://www.w3.org/TR/xml-names/)
- [W3C XML Conformance Test Suites](https://www.w3.org/XML/Test/)
