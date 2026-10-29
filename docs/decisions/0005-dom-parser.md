# ADR-0005: DOMParser の追加

## ステータス

accepted

## コンテキスト

palim には、HTML 文字列を受け取り DOM tree を返す公開 API がない。

`DOMParser` を実装する。

準拠対象、初期 API、対象外とする機能、および既存の仕様準拠度・速度・メモリ計測への接続を決める必要がある。

## 決定

- HTML 文字列から DOM tree を構築する公開 API として `DOMParser` を追加する
- 初期実装は `parseFromString(input, "text/html")` を対象とする
- `DOMParser` の動作は WHATWG HTML Living Standard 8.5.1 The `DOMParser` interface の `text/html` branch に準拠する
- HTML の解析処理は WHATWG HTML Living Standard 13.2 Parsing HTML documents に準拠する
- parse result の tree と公開 interface は WHATWG DOM に準拠する
- XML parser を必要とする MIME type は初期実装の対象外とする
- parse result の参照に必要な DOM interface だけを初期実装へ含める
- 仕様準拠度、速度、メモリ使用量は ADR-0002、ADR-0003、ADR-0004 の方法で計測する
- 未実装範囲を外部 test の母数から除外せず、理由を付けて記録する

## 影響

- HTML parser と、parse result を表現する DOM 実装が必要になる
- XML、XHTML、SVG document parsing を必要とする用途には対応できない
- DOM 全体ではなく、初期 API と parsing に必要な範囲から実装を開始できる
- 機能追加による仕様準拠度、速度、メモリ使用量の変化を既存の計測方法で比較できる

## 代替案

### palim 固有の parse API を追加する

Web platform の標準 API および既存 test suite との対応が弱くなるため採用しない。

### HTML parser と XML parser を同時に追加する

parsing algorithm、error handling、namespace の扱いが異なり、初期実装と検証の範囲が広がるため採用しない。

### DOM 全体の実装後に DOMParser を追加する

HTML parsing と DOM tree 表現を小さな単位で検証できなくなるため採用しない。

## 参考資料

- [Design log](../design-log/0005-dom-parser.md)
- [ADR-0002](./0002-compliance-measurement.md)
- [ADR-0003](./0003-speed-measurement.md)
- [ADR-0004](./0004-memory-measurement.md)
- [WHATWG HTML: The DOMParser interface](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#the-domparser-interface)
- [WHATWG HTML: Parsing HTML documents](https://html.spec.whatwg.org/multipage/parsing.html#parsing)
- [WHATWG DOM: Nodes](https://dom.spec.whatwg.org/#nodes)
