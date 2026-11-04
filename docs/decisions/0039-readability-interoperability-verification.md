# ADR-0039: Mozilla Readability との相互運用性検証

## ステータス

accepted

## コンテキスト

WPT は browser environment 全体の相互運用性を確認できる一方、実行時間、timeout、および未実装の platform capability の影響が大きい。
palim の DOM を実際の consumer へ渡せるかを、より狭い範囲かつ短い反復で確認する手段も必要である。

Mozilla Readability は外部の DOM 実装が生成した `Document` を受け取り、記事本文と metadata を抽出する。
Readability は query、tree traversal、attribute、node mutation、cloning、HTML serialization、document URL など複数の DOM API を組み合わせて使用するため、palim の consumer interoperability を確認する対象として利用できる。

ただし Readability の出力は minor release 間でも変わり得る。
また、実行中の例外、記事を抽出できない結果、抽出内容の差、および metadata の差を一つの失敗として扱うと、palim 側で修正すべき境界を判断しにくい。

## 決定

- Mozilla が公開する未変更の `@mozilla/readability` を検証対象とする
- 最初の検証対象は `@mozilla/readability` 0.6.0 とする
- `@mozilla/readability` は exact version の `devDependency` として固定し、package lock の integrity も保持する
- upstream test fixture は `conformance/conformance.json` で commit SHA を固定し、`tools/conformance/sync.sh` による既存の取得方式へ統合する
- Readability package と upstream test fixture の更新は、palim の実装変更および互いの更新と分離してレビューする
- 小さな project fixture による connection test と、upstream corpus 全件による compatibility test の二段階で検証する
- connection test は通常の project test、upstream corpus は conformance test として実行する
- `Document` の生成から Readability の呼び出しまでは palim の公開 API だけを使用し、Readability 専用の monkey patch、DOM shim、Readability source の変更、fixture の書き換え、および内部状態の変更で不足を補わない
- network access、page script の実行、および外部 resource の読み込みを検証条件に含めない
- upstream corpus は upstream が提供する expected content と metadata を期待結果とし、serialization の表記ではなく content tree と metadata を比較する
- connection error や既知の未実装 API を corpus の母数から除外せず、case ごとの結果と分類別件数を記録する
- compatibility test の結果は既存の conformance report に独立した suite として集計し、機械可読な JSON と同じ内容の Markdown を生成する
- 固定 revision の全 corpus を実行した場合だけ version 管理する conformance report を更新する

## 影響

- WPT の browser environment 全体を起動せず、実際の DOM consumer に対する相互運用性を確認できる
- connection test により、Readability の大きな corpus を実行する前に基本的な接続破壊を検出できる
- corpus の失敗を DOM API の不足、抽出不能、content 差、および metadata 差に分けて修正対象を選べる
- Readability の全 case 数、成功数、成功率、および失敗分類を既存の conformance report から継続的に確認できる
- document URL と `baseURI` も相互運用性の一部として検証される
- exact version の `devDependency`、conformance manifest による fixture の同期、ライセンス表示、および結果レポートの生成処理が必要になる
- Readability release または fixture revision の更新時には、algorithm の変更による期待結果差と palim の変更を分離して確認する必要がある
- `@mozilla/readability` は検証時だけ必要な `devDependency` とし、palim の runtime dependency にはしない

## 代替案

### 独自の小さな fixture だけを使用する

接続確認には適するが、実際の記事で使用される DOM operation の組み合わせと metadata 抽出を十分に確認できないため、connection test に限定する。

### Upstream の test suite をそのまま実行する

upstream runner と jsdom の構成に palim を組み込む必要があり、palim project の test runner と結果分類を使用できないため採用しない。

### jsdom の結果との都度 differential test を行う

reference 実装の追加と二重実行が必要になり、upstream が既に管理する expected content と metadata からも独立してしまうため採用しない。
原因調査時の補助手段としては使用できる。

### Serialized HTML を文字列として比較する

attribute order、空白、および同値な serialization の差が content の構造差と混在するため採用しない。

### 不足 API を test 専用 shim で補う

palim の公開 `Document` を consumer が直接利用できるかという検証目的を満たさないため採用しない。

## 参考資料

- [ADR-0002](./0002-compliance-measurement.md)
- [ADR-0005](./0005-dom-parser.md)
- [ADR-0016](./0016-node-cloning-and-adoption.md)
- [ADR-0034](./0034-window-host-execution-entry-point.md)
- [Design log](../design-log/0039-readability-interoperability-verification.md)
- [Mozilla Readability](https://github.com/mozilla/readability)
