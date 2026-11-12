# WPT 適合度改善の作業方針

## 目的

DOM 操作の仕様適合度と WPT 適合度を継続的に上げる。
実装判断では仕様への適合を優先し、WPT の通過自体を目的にしない。
WPT は仕様適合を観測し、変更前後を比較するための検証手段として扱う。
WPT は page realm と周辺 capability を含む統合結果であり、DOM implementation 単独の適合度には使用しない。

DOM behavior の実装状況と検証状況は、[DOM 仕様適合性監査の作業方針](./dom-conformance-workflow.md) に従って層別に記録する。
実装修正の順序を WPT report の掲載順だけで決めない。

## 原則

- 特定の WPT URL、fixture、failure message、または期待値だけを満たす分岐や特別扱いを実装しない
- WPT の期待結果だけから要件を決めず、対応する仕様本文と algorithm を確認する
- page realm に機能や algorithm を重複実装せず、engine 非依存の実装へ package interface と page realm の両方を接続する
- Living Standard と WPT の期待が一致しない場合は、次節の扱いに従う
- WPT status が改善しても、仕様適合を確認できなければ TODO を完了にしない
- TODO への対応で WPT ファイル内の別の問題が発生してもその修正を完了条件とはしない
- 新しいオブジェクトの追加や設計の変更が必要になるときは作業を行わない
- 設計および実装方針はそれまでの ADR を参照して決める

## Living Standard と WPT の不一致

- 実装判断には、確認時点で Living Standard に取り込まれている normative requirement と algorithm を採用する
- WPT は仕様適合を確認する検証材料であり、Living Standard と異なる期待値だけを根拠に実装を変更しない
- file 名に `.tentative.` を含む test URL と、`tentative` directory 以下の test URL は、未確定の提案を追跡する test として扱い、現在の Living Standard への適合判定から除外する
- 関連する仕様変更の pull request が未 merge の場合は、tentative WPT の期待を現在の仕様要件として採用しない
- 仕様変更が Living Standard へ merge 済みで、固定した WPT revision または fixture の IDL が追随していない場合は、Living Standard に従い、fixture の遅れを別の不一致として記録する
- 不一致を見つけた場合は実装を変更せず、Living Standard の section、WPT URL、期待値の差、関連 issue または pull request、および判定を作業 report に記録して作業を止める
- 未 merge の提案を先行して採用する場合は、通常の WPT 修正とは分離し、明示的な設計判断を行う

WPT 進捗レポートでは、全選択 URL の実行進捗を保持したうえで、tentative test の集計と不通過一覧を non-tentative test から分離する。tentative test の結果は、現在の Living Standard に対する成功率へ含めない。

## WPT failure の分類

WPT failure を実装項目へ変換する前に、次のいずれかへ分類する。

- DOM の状態または standard algorithm
- package interface と DOM implementation の接続
- Web IDL conversion、interface exposure、descriptor、callback、exception、または realm identity
- Window、Document lifecycle、script、task、resource loading、または navigation の統合
- CSS、layout、network、storage、media などの周辺 capability
- runner、testharness、timeout、または JavaScript engine parser
- Living Standard と固定 WPT revision の期待の不一致
- 未分類

周辺 capability、runner、または仕様差によって評価できない test は、DOM algorithm の failure として扱わない。
未分類の failure は pass、unsupported、または DOM の欠落へ推測で割り当てない。
一つの WPT file に複数の原因がある場合は、subtest または到達段階ごとに分けて記録する。

## 作業範囲

一回の作業範囲は、選択した TODO と、対象となるファイルの状況から決める

- 未完了の TODO から一項目を選び、その項目で改善する対象 behavior を変更前に明記する
- WPT report の掲載順ではなく、DOM behavior の監査結果、依存関係、および blocker の分類から項目を選ぶ
- interface 名、WPT directory、仕様領域、または実装 module の境界を、そのまま作業範囲にしない
- 対象 behavior を仕様どおりにするために必要な変更は、複数の仕様や実装 module にまたがっても対象に含める
- WPT を先へ進めるためだけに必要で、対象 behavior 自体の仕様適合には必要でない機能は、その項目では実装しない
- 対象 behavior と独立して記述できる先行条件や別の失敗は、必要に応じて別の TODO として記録する
- 作業中に別の失敗を見つけても、変更前に定めた対象 behavior を追加して一項目の範囲を広げない

## 作業単位と直列化

- 一回の変更では TODO の一項目だけを扱う
- TODO 単位、WPT file 単位、または実装 file 単位で複数の改善作業を並列化しない
- DOM 実装、IDL binding、tree mutation、Range 更新、例外処理などの共有箇所が相互に依存するため、一項目の選択から commit までを直列に完了させる
- 次の TODO の調査と変更前 WPT 実行は、現在の項目の commit が完了してから開始する

## 作業 report

項目ごとに `tmp/todo/` 以下へ一つの Markdown report を作る。
report は調査と作業の記録であり、commit には含めない。

report には少なくとも次を記録する。

- 対象 TODO と対象 behavior
- 参照する仕様の section
- 対応する WPT URL または file
- WPT failure の層別分類
- 変更前の WPT 結果と failure message
- package interface と page realm の変更前の検証結果
- 修正方針
- 変更内容
- 変更後の WPT 結果と変更前との差
- 残る failure と今回扱わない独立した behavior
- 作業中に見つけた事項
- TODO の更新内容
- 最終検証結果
- commit

report の template は `tmp/todo/README.md` に置く。

## 作業手順

### 1. 項目の選択

`TODO.md` から未完了項目を一つ選ぶ。
`tmp/todo/<todo-slug>.md` を作り、対象 behavior と今回扱わない独立した behavior を明記する。
DOM behavior manifest が存在する領域では behavior ID、対象層、および依存 behavior も記録する。

### 2. 変更前の確認

対応する WPT の test URL または test file を個別指定して実行する。

```sh
npm run wpt:test -- <test-url-or-path>
```

実行 command、WPT revision、対象 URL、status、関係する subtest の結果、および failure message を report に記録する。
対象 behavior と独立した先行 blocker がある場合は、その事実と今回評価できる範囲も記録する。
実行前または failure 到達後に原因を層別分類し、WPT だけでは対象 behavior を評価できない場合は `blocked` と理由を記録する。

### 3. 仕様確認と修正方針

実装を変更する前に、参照する仕様の section、仕様上必要な動作、および修正方針を report に記録する。
WPT の期待結果から仕様要件を推測するだけでなく、該当する仕様本文と algorithm を確認する。

### 4. 修正

変更前に定めた対象 behavior を仕様どおりにするための修正だけを行う。
作業中に見つけた独立した課題は TODO に記録し、現在の修正へ混ぜない。
DOM algorithm を page realm binding 内へ実装せず、package interface と page realm が同じ engine 非依存の実装を使用する構成を維持する。

### 5. 変更後の確認

変更前と同じ WPT の test URL または test file を個別指定して再実行する。
変更後の status、関係する subtest の結果、および変更前との差を report に記録する。

仕様本文と algorithm に照らして対象 behavior が適合したことを、実装の確認と test 結果の両方で評価する。
対象とした failure の解消、対象 behavior の通過数の増加、または対象 behavior を越えた後続段階への到達は、WPT 上の改善として記録する。

package interface と page realm の両方へ公開する behavior は、両経路の結果を確認する。
WPT の改善だけでは DOM behavior を検証済みとせず、DOM 仕様適合性監査の status も更新する。

同じ WPT file に残る、対象 behavior と独立した subtest が失敗しても作業は終了する
対象 behavior に仕様上または WPT 上の改善がない場合は TODO を完了にせず、report に結果と blocker を残す。

### 6. TODO の更新

- 仕様適合と改善を確認できた項目を `TODO.md` で完了にする
- 作業中に新たな機能追加、仕様差、または性能改善の必要性を見つけた場合は `TODO.md` に追加する
- 新しく見つけた項目は記録だけを行い、現在の作業項目へ含めない

### 7. 統合前の検証

個別 WPT で改善を確認し、`TODO.md` と report を更新した後、次を実行する。

```sh
npm run check
npm run conformance:test
```

### 8. Commit

両 command に問題がなければ `.commit-template.txt` の形式に従って commit する。

- 件名は `:emoji: Subject` とする
- 絵文字は shortcode を使う
- subject は50文字以内の命令形の英語とし、末尾にピリオドを付けない
- body が必要な場合は空行で分け、what と why を記述する
- `tmp/todo/` 以下の report は commit に含めない

commit が完了したら次の TODO 一項目へ進み、同じ手順を繰り返す。

## 関連文書

- [ADR-0001: git commit テンプレートの採用](./decisions/0001-git-commit-template.md)
- [ADR-0002: 仕様準拠度の継続計測](./decisions/0002-compliance-measurement.md)
- [ADR-0025: DOM interface、binding、implementation の分離](./decisions/0025-dom-interface-binding-implementation.md)
- [ADR-0033: wptrunner との接続](./decisions/0033-wptrunner-product-integration.md)
- [ADR-0038: WPT 進捗レポートの集計方針](./decisions/0038-wpt-progress-report.md)
- [ADR-0040: WPT の分割 campaign 実行と累積レポート](./decisions/0040-wpt-partitioned-campaign.md)
- [ADR-0041: Web IDL realm binding の実装境界と分割](./decisions/0041-web-idl-realm-binding-boundary.md)
- [ADR-0045: WPT 対象範囲の拡張](./decisions/0045-expand-wpt-scope-for-exposed-web-apis.md)
- [ADR-0053: DOM 仕様適合性の層別計測](./decisions/0053-layered-dom-conformance-measurement.md)
