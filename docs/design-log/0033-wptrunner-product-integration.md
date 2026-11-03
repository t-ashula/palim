# ADR-0033 Design log: wptrunner との接続

## 対象

palim product は wptrunner が選択した WPT を受け取る。
特定の test file や完了方法だけを palim 独自の対象として定めない。

## 実行階層

### Docker command

host 側の test command は Docker を起動し、container 内で `wpt run palim <url>` を実行する。
この command は他の browser product を指定する場合と同じ形にする。

### palim product adapter

wptrunner は palim product adapter を product として呼び出す。
wptrunner への登録に必要な部分は Python で実装し、Node process との接続を別の module に分けることができる。

adapter は wptrunner から test HTML の URL を受け取り、Node process へ渡す。
adapter が test ごとに扱う入力は URL だけとする。

### Node runner

Node runner は palim package を読み込み、受け取った URL で ADR-0034 の `open(url)` を呼び出す。
palim の内部 module は読み込まない。

Node process の開始と終了は palim product adapter が管理する。
process の異常終了は wptrunner へ通知する。

test の検索と選択は product adapter へ移さない。
test resource の URL は wptrunner が構成したものを使用する。
expected result の判定も product adapter へ移さない。

## Test の対象範囲

palim が機能領域全体を対象外とする場合は、wptrunner の test 選択でその領域を除外する。
video や audio を対象外とする場合は、それらの WPT をまとめて実行対象から外す。

対象外領域の test ID を列挙しない。
対象外領域の case ごとに skip metadata も作成しない。

対象とする領域では test file や subtest を実装状況に合わせて除外しない。
その領域に残る未実装機能は実行結果に現す。

領域の境界は WPT 上の安定した選択条件で表現する。
個別 case の増減に合わせて除外設定を更新する方式にはしない。

## 実行結果

timeout と結果の集約は wptrunner が行う。
product adapter は Node runner の結果を wptrunner へ返す。

palim の実装状況に合わせて結果を成功へ読み替えない。
expected result の metadata は wptrunner の仕組みを使用する。

## Docker 境界

WPT の実行は Docker 内で閉じる。
host は project source を container へ渡し、実行 command を開始する。

container は `conformance/conformance.json` が指定する WPT revision を使用する。
wptrunner と palim product も container 内で実行する。
WPT の data file を読む既存の conformance test は、container 内の同じ WPT revision を参照する。

実行後の conformance report は project の既存配置へ書き出す。
WPT 自体の実行環境は host 側の前提にしない。

## 完了条件

- Docker 内で `wpt run palim <url>` を実行できる
- wptrunner が palim product adapter を product として呼び出せる
- product adapter が test HTML の URL だけを Node runner へ渡す
- Node runner が ADR-0034 の `open(url)` から WPT を実行できる
- 実行結果が wptrunner の出力に残る
- 対象外領域を case ごとの skip なしで実行対象から外せる
- 対象領域の未実装機能を事前除外せず結果として確認できる
- WPT の data file を読む既存の conformance test が Docker 内で継続して動作する
- host に WPT の実行環境を導入せず同じ結果を再現できる

## 参考資料

- [ADR-0033](../decisions/0033-wptrunner-product-integration.md)
- [ADR-0032 Design log](./0032-parser-inserted-external-classic-script.md)
- [ADR-0034 Design log](./0034-window-host-execution-entry-point.md)
- [web-platform-tests: Custom products](https://web-platform-tests.org/running-tests/custom-products.html)
- [web-platform-tests: wptrunner internals](https://web-platform-tests.org/tools/wptrunner/docs/internals.html)
