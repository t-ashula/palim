# ADR-0040 Design log: WPT の分割 campaign 実行と累積レポート

## 目的

ADR-0040 で決定する WPT campaign を、実行制御、保存形式、再開、および集計へ接続できる粒度に整理する。
固定条件と集計上の原則は ADR-0040 に置き、この文書には campaign の lifecycle と実装時の境界を記録する。

## Campaign の固定条件

campaign 開始時に少なくとも次を記録する。

- campaign ID
- WPT repository revision
- WPT manifest の識別情報
- include と exclude の内容および digest
- 選択された URL の一覧および digest
- palim の git revision と dirty state
- campaign 用に一度だけ build した container image ID
- Node.js、Python、および wptrunner の識別情報
- timeout multiplier など結果に影響する runner option
- campaign metadata と report の schema version
- 開始日時

git revision が同じでも build context に未 commit の変更があれば同一条件とはみなさない。
worker は campaign 開始時に確定した同じ container image を使用し、進行中の source 変更を取り込まない。

## 対象 URL の作成

対象 URL は既存の WPT manifest、include、および exclude から決定的に列挙する。
列挙結果は campaign directory に保存し、再開時に現在の manifest から作り直さない。

一つの manifest source file が複数の test URL を生成する場合も、実行と集計の単位は URL とする。
選択対象に含まれない URL を worker result が報告した場合は campaign result に取り込まず、実行条件の不一致として記録する。

## Directory 構成

保存先は次の構造を基本とする。

```text
tmp/wpt/campaigns/<campaign-id>/
  campaign.json
  urls.json
  state.json
  attempts/
    <attempt-sequence>/
      attempt.json
      wptreport.json
      results.jsonl
      run.json
  merged/
    wptreport.json
    report.json
    report.md
```

`campaign.json` と `urls.json` は campaign 開始後に変更しない。
`attempts/` の結果も上書きせず、再実行では新しい attempt sequence を割り当てる。
`state.json` と `merged/` は一時 file へ完全な内容を書いた後に置き換える。

## Queue と worker

coordinator が対象 URL ごとの状態を管理し、worker は一度に一つの URL を受け取る。
状態は少なくとも `pending`、`running`、`completed` を区別する。

既定の worker 数は 10 とし、command option で変更できるようにする。
各 worker は同じ URL を明示して wptrunner を起動し、固有の attempt directory だけへ出力する。
複数 worker が Python virtual environment の作成や product install を同時に変更しないよう、共有する実行環境の準備は campaign の並列実行前に一度だけ完了させる。

wptrunner が管理する test timeout に加えて、container を含む実行単位全体へ終了期限を設ける。
終了期限、process failure、または有効な `wptreport.json` がない attempt は `completed` にしない。
その URL は backoff 後に再投入でき、campaign を停止しても次回の再開対象に残す。

coordinator の異常終了時に `running` だった URL は、再開時に対応する有効な attempt result がなければ `pending` へ戻す。
test が報告した `TIMEOUT` と worker 自体の終了期限超過は区別する。

## Attempt result

`attempt.json` には少なくとも次を記録する。

- campaign ID
- attempt sequence
- 対象 URL
- worker ID
- 開始日時と終了日時
- process exit status
- attempt state
- result file の相対 path

test の pass、fail、error、timeout、および skip は wptrunner の report から取得する。
worker process の失敗を test の error や timeout として合成しない。

一つの attempt が対象 URL と異なる URL の結果を含む場合、または同じ URL の結果を複数含む場合は invalid attempt とする。
再実行により同じ URL の有効な result が複数存在する場合、最大の attempt sequence を持つ完了結果を採用する。

## 累積集計

coordinator は既定で、10 attempt の完了または前回集計から 60 秒の経過のうち、先に成立した時点で集計する。
この値は実行時に変更できる。
正常終了、割り込み、および停止 signal の受信時にも最後の集計を試みる。

集計では次の順序で処理する。

1. campaign の固定条件と対象 URL を読む
2. 完了した attempt の schema と campaign ID を検証する
3. URL ごとに採用する attempt を決める
4. 採用した wptrunner result から累積した `wptreport.json` を生成する
5. ADR-0038 の母数と分類規則で report JSON を生成する
6. 同じ JSON から Markdown を生成する
7. campaign 内の `merged/` を原子的に更新する
8. 継続的な進捗レポートを原子的に更新する

report の並び順は attempt の完了順ではなく URL の決定的な順序とする。
同じ campaign state からは同じ JSON と Markdown を生成できるよう、集計時刻などの変動値は結果本体と metadata の境界を分ける。

## Report の状態

既存の test outcome と campaign lifecycle を混同しないよう、累積 report は campaign state を別 field で持つ。
少なくとも次を区別する。

- `running`: worker が実行中であり、途中集計である
- `interrupted`: campaign が未完了のまま停止した
- `completed`: 全対象 URL に有効な result がある

`completed` は全 test の pass を意味しない。
pass、fail、skip、error、および timeout は URL totals と subtest totals に保持する。

継続的な report には少なくとも次を追加する。

- campaign ID と campaign state
- palim build の識別情報
- 集計対象になった attempt sequence の上限
- 最終集計日時
- worker failure と retry の件数

途中 report でも全対象 URL を母数とし、有効な result がない URL は `pending` とする。
これにより進捗率と実行済み test の成功率を ADR-0038 と同じ意味で維持する。

## 個別調査との分離

campaign command を介さずに URL や directory を指定した実行は ad hoc run とする。
ad hoc run は従来どおり固有の一時 directory に report を生成し、campaign の attempt directory と継続的な report を変更しない。

既存の `tmp/wpt/<session-id>/` にある result は、container image ID、選択 URL digest、および固定した runner option を持たない。
そのため、新しい campaign へ自動 import しない。

## 再開と終了

再開時は campaign ID を明示し、保存済みの固定条件と現在利用可能な image を検証する。
image または固定 fixture が失われて同じ条件を再現できない場合は、その campaign を再開せず新しい campaign を開始する。

全 URL に有効な result が得られた時点で campaign を `completed` にする。
利用者による割り込みでは worker を停止し、完了済み attempt を最後に集計して `interrupted` とする。
再開すると同じ campaign を `running` に戻し、未完了 URL だけを queue へ入れる。

## 実装時の検証項目

- manifest からの URL 列挙が既存 report の母数と一致する
- worker 数を超えて同時実行されない
- 同じ URL が同時に二つの worker へ割り当てられない
- test timeout と worker failure を区別できる
- invalid または別 campaign の attempt を集計しない
- 再実行では最新の有効な attempt が選ばれる
- 集計中の割り込みで既存 report が途中書き込みにならない
- coordinator の停止後に未完了 URL から再開できる
- 同じ campaign state から同じ集計結果を生成できる
- ad hoc run が campaign report を変更しない

## 参考資料

- [ADR-0040](../decisions/0040-wpt-partitioned-campaign.md)
- [ADR-0038 Design decision](../decisions/0038-wpt-progress-report.md)
