# ADR-0008: tree construction 適合テストの実行方式

## ステータス

accepted

## コンテキスト

palim の tree builder が HTML の tree construction algorithm に適合しているかを、外部 fixture によって継続的に検証する必要がある。

ADR-0002 は tree construction の主要な外部テストコーパスとして WPT の HTML syntax parsing resources を選択している。
html5lib-tests repository で管理されていた tree construction tests は WPT へ移管され、現在は WPT に html5lib 形式の `.dat` fixture として維持されている。

WPT が提供する browser 向け wrapper は `Window`、`document.write`、Blob URL、`innerHTML` などを前提とする。
一方、`.dat` fixture 自体は入力、fragment context、scripting flag、および canonical tree を定義しており、palim の parser を直接呼び出して検証できる。

fixture の取得方法、未実装 capability を含む case の扱い、および DOM tree の比較方法を決める必要がある。

## 決定

- tree construction の test data は、WPT の `html/syntax/parsing/resources/*.dat` にある html5lib 形式の fixture を使用する
- fixture の読み込み、case 展開、palim parser の呼び出し、および期待値との比較は、palim の test implementation として Vitest 上で実行する
- browser 向けの `html5lib_*.html` wrapper は使用しない
- fixture の `#data`、`#document-fragment`、`#script-off`、`#script-on`、および `#document` section を解釈する
- `#errors`、`#new-errors`、および `#errors-new` section は、palim が parse error 取得 API を提供していないため比較対象にしない
- `#script-off` と `#script-on` のいずれも指定されていない case は、fixture format に従って scripting flag の両方の値へ展開する
- script 実行など、case の実行に必要な capability が未実装の場合、その case を理由付きで `unsupported` または `skip` として明示し、黙って対象から除外しない
- tree の比較では fixture format が定める canonical tree dump を生成して直接比較し、HTML serialization の結果を代用しない
- document parse と fragment parse を別の集計単位とし、scripting flag の値を各 case の実行条件として記録する
- case ID および結果分類は ADR-0002 の規則に従う

## 影響

- WPT fixture の revision を conformance manifest で管理する必要がある
- WPT 全体の browser 実行環境を用意する前に、tree construction algorithm を palim 単体で検証できる
- script 実行環境などの capability が追加されるたびに、同じ fixture から実行可能な case が増える
- tree dump の生成処理は fixture 専用の比較表現となり、公開する HTML serialization API とは分離される
- fixture format または配置が upstream で変更された場合は、固定 revision の更新と test implementation の変更を分離して確認する必要がある

## 代替案

### html5lib-tests repository の過去 revision を使用する

移管前の fixture は更新されず、現在の HTML Living Standard に対する変更を追跡できないため採用しない。

### WPT の browser 向け wrapper をそのまま実行する

現段階の palim が提供していない `Window`、`document.write`、Blob URL、および testharness.js の実行環境が必要になり、tree builder 単体の検証範囲を超えるため採用しない。

### `.dat` fixture を palim repository に複製する

upstream revision との対応が不明確になり、更新差分を独立して確認しにくくなるため採用しない。

### HTML serialization した文字列を期待値と比較する

tree construction と serialization の不具合を分離できず、fixture が定める namespace、attribute、および template contents を含む canonical tree と比較できないため採用しない。

## 参考資料

- [ADR-0002](./0002-compliance-measurement.md)
- [html5lib-tests](https://github.com/html5lib/html5lib-tests)
- [WPT: HTML syntax parsing](https://github.com/web-platform-tests/wpt/tree/master/html/syntax/parsing)
- [WPT: Tree Construction Tests](https://github.com/web-platform-tests/wpt/tree/master/html/syntax/parsing/resources)
- [WHATWG HTML: Tree construction](https://html.spec.whatwg.org/multipage/parsing.html#tree-construction)
