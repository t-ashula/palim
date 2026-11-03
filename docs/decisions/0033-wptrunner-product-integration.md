# ADR-0033: wptrunner との接続

## ステータス

accepted

## コンテキスト

現在の conformance test は WPT の data file を project test から読み込み、palim の個別機能を検証している。
この方式では、WPT の test document を wptrunner から実行した結果を取得できない。

palim の browser environment には未実装の機能が残っている。
その不足は接続を見送る理由ではなく、WPT の実行結果として観測する対象である。

palim が機能領域全体を対象外とする場合、その領域に属する case を個別の skip として管理する必要はない。

WPT 自体は python による実装が主体であり、ホスト名の調整なども行うため WPT の実行に必要な環境は、palim の通常の開発環境へ持ち込まない方法が必要である。

## 決定

- palim を wptrunner の product として接続する
- wptrunner から渡された test URL は palim product adapter が Node runner へ渡す
- test の選択、resource の提供、timeout、および結果の集約は wptrunner に任せる
- palim が対象としない機能領域は、wptrunner の test 選択時に領域単位で除外できる
- 対象外領域に属する case ごとの ID と skip 設定は作成しない
- 対象とする領域では、palim の実装状況を理由とする test の事前除外を行わない
- Node runner は ADR-0034 の host execution entry point だけを使用する
- WPT と wptrunner は Docker 内で実行する
- WPT の data file を使用する既存の conformance test も同じ Docker 環境で実行する
- host へ出力する実行結果は、既存の conformance report の管理方法に合わせる

## 影響

- browser environment の不足が wptrunner の実行結果に現れる
- 対象外領域は個別の skip result を生成せず、実行対象から外れる
- palim product と executor の実装が必要になる
- WPT を用いる conformance command は Docker を経由する
- host では WPT の実行環境を準備せず、Docker を実行できればよい
- WPT の取得と実行にかかる時間および保存領域は Docker 側で管理する必要がある

## 代替案

### project test から WPT の HTML を直接実行する

wptrunner が担う test の実行条件と結果処理を再実装することになるため採用しない。

### 実行可能な HTML 一件だけを先に接続する

palim 独自の実行条件を作り、wptrunner product として必要な接続を後回しにするため採用しない。

### browser environment の完成後に接続する

未実装機能による失敗を継続的に観測できないため採用しない。

### WPT の実行環境を host に導入する

palim の通常の開発環境が WPT 側の実行条件に依存するため採用しない。

## 参考資料

- [Design log](../design-log/0033-wptrunner-product-integration.md)
- [ADR-0002](./0002-compliance-measurement.md)
- [ADR-0032](./0032-parser-inserted-external-classic-script.md)
- [ADR-0034](./0034-window-host-execution-entry-point.md)
- [web-platform-tests: Running tests from the local system](https://web-platform-tests.org/running-tests/from-local-system.html)
- [web-platform-tests: Custom products](https://web-platform-tests.org/running-tests/custom-products.html)
