# ADR-0053: DOM 仕様適合性の層別計測

## ステータス

accepted

## コンテキスト

WPT は page realm、Web IDL binding、Window lifecycle、および周辺 capability を含む統合結果を観測する。
一つの WPT failure には、DOM algorithm の不具合だけでなく複数の前提 capability の不足や test runner の問題が含まれ得る。

このため、WPT の失敗 URL を順番に修正しても、DOM の状態と algorithm がどこまで実装され、package interface と page realm の両方から同じ挙動として利用できるかを判断できない。
method や interface の存在、project test の通過、または定性的な capability status のいずれか一つだけでも、仕様適合を示す証拠にはならない。

DOM の実装状況と検証状況を分離し、仕様上の behavior から各実行経路と外部 test までを追跡できる計測方法が必要である。

## 決定

- DOM 仕様適合性の計測単位を、WPT URL、interface 名、実装 file、または method の存在ではなく、仕様が定める behavior とする
- 各 behavior を次の層に分けて検証する
  - engine 非依存の DOM 状態と standard algorithm
  - package が公開する interface から DOM implementation へ到達する経路
  - Web IDL conversion、interface exposure、property descriptor、exception、および realm identity
  - Window、Document lifecycle、script、task、および resource loading との統合
  - WPT による page realm を含む相互運用性
- implementation status と verification status を別の値として記録する
- implementation status は `present`、`partial`、`absent` とする
- verification status は `verified`、`failed`、`unverified`、`blocked`、`ambiguous` とする
- test または外部 fixture が存在しない behavior を、実装の存在だけを根拠に `verified` としない
- behavior ごとに仕様参照、対象 interface、実装箇所、公開経路、検証 case、外部 test、前提 capability、blocker、および層別結果を機械可読な manifest として管理する
- package interface と page realm の両方へ公開する behavior は、同じ入力、状態変化、および成功・失敗条件を両経路で検証する
- object identity、prototype、property descriptor、argument conversion、callback、および exception の realm は、DOM algorithm の結果と分けて binding の検証対象とする
- Web IDL と WPT の interface fixture は公開 surface の棚卸しに使用できるが、standard algorithm と状態の実装元にはしない
- 外部 fixture が利用可能な behavior は固定 revision の fixture を優先し、project test は依存方向、接続、および外部 fixture が扱わない規定を補完する
- WPT failure は、DOM algorithm、package interface、Web IDL / realm binding、Window 統合、周辺 capability、runner / harness、および仕様と test の不一致に分類する
- 周辺 capability または runner によって blocked となる WPT を、DOM algorithm の failure として集計しない
- WPT の成功だけを根拠に、関係する DOM behavior 全体を `verified` としない
- `docs/capabilities.md` の status は利用可能な機能範囲を表す定性的な案内として維持し、層別の仕様適合性 report と分離する
- 初期監査対象は `Node`、`Element`、`Document` の tree mutation behavior とし、計測形式を確認してから collection、traversal、range、event、および parsing へ広げる

## 影響

- WPT の進捗と DOM の仕様適合性を別の系列として確認できる
- 実装は存在するが検証されていない behavior と、前提 capability によって検証できない behavior が可視化される
- package interface と page realm の一方だけに存在する機能や、同じ DOM implementation へ接続されていない経路を検出できる
- behavior manifest、層別 test、結果記録、および report 生成の仕組みが必要になる
- 一つの WPT failure を複数の層へ分解して調査する作業が発生する
- 実装修正の順序は WPT report の掲載順ではなく、behavior の層別監査で判明した欠落と依存関係から決める
- 既存の WPT report は page realm を含む統合結果として引き続き維持する

## 代替案

### WPT の失敗 URL を順番に修正する

周辺 capability と runner の failure が混在し、DOM implementation、binding、および統合のどの層が不足しているかを継続的に判断できないため採用しない。

### 公開 method と interface の存在を計測する

algorithm、状態変化、例外、identity、および lifecycle との接続を確認できないため採用しない。

### project test の通過を仕様適合性として扱う

実装と同じ仕様解釈を共有し、未作成の case が母数から消えるため採用しない。

### WPT の成功率を DOM の仕様適合率として扱う

WPT は DOM 以外の capability と page lifecycle を含み、URL と subtest の母数も DOM behavior の母数とは一致しないため採用しない。

## 参考資料

- [DOM 仕様適合性監査の作業方針](../dom-conformance-workflow.md)
- [ADR-0002](./0002-compliance-measurement.md)
- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0038](./0038-wpt-progress-report.md)
- [ADR-0041](./0041-web-idl-realm-binding-boundary.md)
- [ADR-0045](./0045-expand-wpt-scope-for-exposed-web-apis.md)
- [WHATWG DOM Standard](https://dom.spec.whatwg.org/)
- [WHATWG Web IDL Standard](https://webidl.spec.whatwg.org/)
- [Web Platform Tests](https://web-platform-tests.org/)
