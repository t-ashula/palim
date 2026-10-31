# ADR-0009: context element を使用する fragment parsing

## ステータス

accepted

## コンテキスト

palim の fragment parser は、namespace と local name で表した context を受け取り、WPT の tree construction fixture を実行できる。

一方、`innerHTML`、`outerHTML`、`insertAdjacentHTML()` などの標準 API は、呼び出し対象またはその親を context element として HTML fragment parsing algorithm を実行する。
実際の context element は tokenizer state と insertion mode だけでなく、node document、ancestor の `form` element、`template` の扱いにも影響するため、namespace と local name だけでは情報が不足する。

標準 API から共通して利用する context element 付き fragment parsing の境界を決める必要がある。

## 決定

- context element を使用する fragment parsing は、WHATWG HTML の HTML fragment parsing algorithm に準拠する
- parser は palim の実際の `Element` を context element として受け取る経路を持つ
- context element の namespace、local name、node document、および ancestor chain を parsing state の初期化に使用する
- context element の tree は parsing 中に変更せず、parse result を `DocumentFragment` として返す
- parse result の挿入、置換、対象 node の選択、および例外処理は、`innerHTML` など各公開 API の algorithm が担当する
- `script` element と event handler content attribute は parse result に保持するが、JavaScript は実行しない
- script execution を必要とする動作と test case は、理由付きで `unsupported` として記録する
- parser scripting mode と script execution の連携はこの ADR では決定しない
- namespace と local name だけを受け取る既存の fragment parsing は、外部 fixture が定義する context を実行する経路として維持する
- context element を受け取る palim 固有の公開 API は追加せず、標準の markup insertion API を通して公開する
- Shadow DOM、sanitization、Trusted Types、および declarative shadow roots は初期実装の対象外とする

## 影響

- context element の種類だけでなく、document と ancestor の状態を fragment parsing に反映できる
- `innerHTML`、`outerHTML`、`insertAdjacentHTML()` などが同じ fragment parser を共有できる
- context を名前だけで表す外部 fixture の実行と、実際の DOM を context にする markup insertion を区別する必要がある
- context element parsing の外部動作は、内部 parser を直接呼ぶ test ではなく、公開する markup insertion API を通して検証する必要がある
- script execution がなくても markup insertion API を提供できるが、script execution に依存する仕様範囲は対応済みとして扱わない
- parser scripting mode と JavaScript execution を追加する場合は、markup insertion API との連携を別途決定する必要がある

## 代替案

### namespace と local name だけを使用する

ancestor の `form` element、node document、および `template` に依存する動作を表現できないため採用しない。

### context element を受け取る独自の公開 parse API を追加する

Web platform の標準 API と重複し、利用者が markup insertion algorithm を再実装する必要が生じるため採用しない。

### markup insertion API ごとに fragment parsing を実装する

同じ HTML fragment parsing algorithm の実装と修正が分散するため採用しない。

## 参考資料

- [ADR-0005](./0005-dom-parser.md)
- [ADR-0008](./0008-tree-construction-conformance-tests.md)
- [WHATWG HTML: Parsing HTML fragments](https://html.spec.whatwg.org/multipage/parsing.html#parsing-html-fragments)
- [WHATWG HTML: Dynamic markup insertion](https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html)
