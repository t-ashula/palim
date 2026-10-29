# ADR-0002: 仕様準拠度の継続計測

## ステータス

accepted

## コンテキスト

palim は parser profile や capability ごとに、HTML parsing と DOM の仕様準拠度を定量的に比較できる必要がある。

実装済み範囲だけを母数にした合格率や、既存実装との出力一致だけでは、未実装領域と共通の不具合を見落とす。
外部テストの更新による母数変化と、palim の変更による結果変化も分離する必要がある。

## 決定

- HTML tokenizer は html5lib-tests、tree construction は WPT の HTML syntax parsing resources を主要な外部テストコーパスとする
- 初期実装の計測対象は html5lib tokenizer tests とする
- html5lib tokenizer tests の fixture 読み込み、case 展開、palim tokenizer の呼び出し、期待値との比較を palim の test implementation として実装し、project の test runner で実行する
- WPT の tests は browser 相当の実行環境と palim API が決まった後に計測方法を設計する。これらが未確定の初期実装では対象外とする
- encoding、serialization、DOM API は parser core と別の結果系列として追加する
- 外部コーパスは commit SHA で固定し、更新を実装変更と別にレビューする
- fixture が定める token または canonical tree と直接比較し、HTML の再 serialize による比較を行わない
- case の結果を `pass`、`fail`、`unsupported`、`skip`、`error`、`timeout` に分類し、非合格 case を母数から黙って除外しない
- 各 case の結果に case ID を記録する
- 総合合格率だけでなく人間がわかりやすい分類でも集計する
- case 単位の raw result は実行時生成物として保存し、比較に必要な最終レポートは機械可読な形で version 管理する
- 最終レポートと同じ内容の人間向けレポートを決定的に生成する
- 全 profile および upstream 更新の影響確認を独立した実行モードとして提供する

## 影響

- 各実行の仕様準拠結果を case 単位で確認できる
- capability の追加による準拠度の増分を、速度とメモリの増分に対応付けられる
- 外部 fixture の取得、suite 固有の test 実行、分類、結果保存の仕組みが必要になる
- upstream の更新時には母数と期待結果の変化を確認する作業が発生する
- 意図的な非準拠や未実装範囲も結果として可視化される
- 計測結果の更新ごとに version 管理された最終レポートの差分が発生する

## 代替案

### 独自テストだけを使う

対象仕様の網羅性と他実装との比較可能性が不足するため採用しない。独自テストは palim 固有の動作を検証する手段として外部コーパスを補完する。

### reference browser との differential test だけを使う

reference 側の不具合や実装差を正解として扱う可能性があるため採用しない。differential test は原因調査の補助手段とする。

### 総合合格率だけを公開する

未実装領域と profile ごとの性質が見えなくなるため採用しない。

## 備考

計測を呼び出す契機と、その結果を変更の統合条件にするかどうかは、この ADR では決めない。commit、push、PR、定期実行、release などへの接続は、開発フローを定める別の ADR で決定する。

## 参考資料

- [Design log](../design-log/0002-compliance-measurement.md)
- [WHATWG HTML: Parsing HTML documents](https://html.spec.whatwg.org/multipage/parsing.html)
- [html5lib-tests](https://github.com/html5lib/html5lib-tests)
- [html5lib-tests: Tokenizer tests](https://github.com/html5lib/html5lib-tests/tree/master/tokenizer)
- [WPT: HTML syntax parsing](https://github.com/web-platform-tests/wpt/tree/master/html/syntax/parsing)
