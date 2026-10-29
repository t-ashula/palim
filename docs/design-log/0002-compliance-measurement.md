# ADR-0002 Design log: 仕様準拠度の継続計測

## 目的

仕様準拠度の調査結果を、実装可能な conformance harness の構成へ整理する。最終的な判断は ADR-0002 に置き、この文書には実装方式と検討の詳細を残す。

## 対象範囲

初期対象は html5lib tokenizer tests とする。encoding、serialization、tree construction、DOM API は、それぞれの実行条件が整った段階で別系列として追加する。

### WPT

web platform test の tests は、Document、Window、testharness.js、browser lifecycle などの browser 相当環境を前提とする。
palim API と browser 相当環境の提供範囲が決まるまでは、test の起動方法、入力方法、結果取得方法を定義できない。

このため、WPT の実行と結果記録は初期実装の対象外とする。palim API と実行環境の設計後に、WPT が提供する実行形式を用いた計測方式を別途定める。

## 外部 fixture の取得と配置

外部 fixture の管理方式は `conformance.json` で指定し，conformance ディレクトリにチェックアウトする

`tools/conformance` には各 fixture に対して種々の処理のための置き場とする．
たとえばチェックアウト後に必要な処理であったり，そのスペック内のデータから実装コードやテストに必要なデータを生成する処理などを置く

チェックアウトやその後の操作は必要がない限り sh スクリプトで実装し、 npm script から呼び出せるようにする

想定する配置は次のとおり。

```text
conformance/
  conformance.json
  wpt/
    wpt/
  html5lib/
    html5lib-tests/
  whatwg/
    html/
tools/
  conformance/
    html5lib-tests/
      post-checkout.sh
test/
  conformance/
    html5lib-tokenizer.test.ts

```

```json
{
  "schemaVersion": 1,
  "fixtures": {
    "html5lib/html5lib-tests": {
      "repository": "https://github.com/html5lib/html5lib-tests.git",
      "revision": "<commit SHA>"
    },
    "wpt/wpt": {
      "repository": "https://github.com/web-platform-tests/wpt.git",
      "revision": "<commit SHA>"
    }
  }
}
```

fixture の更新では `conformance.json` を明示的に更新する。

fixture 更新は parser 実装の変更と分離してレビューできる必要がある。実行結果の `run.json` には使用した `conformance.json` の schema version と各 fixture の revision を保存する。

## Test execution

各 test suite について、upstream が定める fixture format、入力条件、期待結果、比較規則に従う。実行コードの所在と起動方法は suite ごとに定める。

### html5lib tests

html5lib tokenizer tests が提供するのは、JSON形式の `.test` fixture とその解釈規則である。
fixture の読み込みから結果比較までを `test/conformance/html5lib-tokenizer.test.ts` に palim の test implementation として実装し、project が採用する test framework 内で実行する。

test implementation は次を行う。

1. `.test` file を読み込み、`tests` または fixture format が指定する collection に含まれる test data を列挙する。
2. `initialStates` の各 state を個別の実行へ展開する。省略時は `Data state` を使用する。
3. `doubleEscaped` と `lastStartTag` を fixture format の規則に従って適用する。
4. input stream preprocessing を含む検証条件で palim tokenizer API を呼び出す。
5. token、parse error、その他の期待項目を fixture format に従って比較し、status と failure detail を確定する。

この test implementation は初期実装の対象とし、palim tokenizer API の確定に合わせて呼び出し部分を接続する。

tree construction、encoding、serialization、DOM WPT は、それぞれの実行条件が整った段階で、fixture data、suite が提供する実行コード、必要な環境の構成を確認して実行方法を定める。

html5lib tokenizer test implementation は、fixture で定義された入力を palim に与え、得られた出力を fixture の期待値と比較して test result を確定する。計測処理は、確定した test result を集約し、最終 report を生成する。

## Result recording

html5lib tokenizer test implementation は expected / actual を比較して結果を確定した後、palim の記録処理へ次を渡す。

- suite の安定 key
- case ID
- relative fixture file name
- suite 固有の実行条件を含む input
- expected 全体
- suite が確定した status と failure detail
- duration、timeout、profile、feature flags

記録処理は test が確定した値と status を保持したまま、`cases.jsonl` の共通 record へ変換する。

## Case ID

case ID は relative fixture file name、input、expected を `JSON.stringify` で直列化し、その SHA-256 digest とする。

```ts
const caseId = sha256(
  JSON.stringify([
    relativeFixtureFileName,
    input,
    expected,
  ]),
);
```

`input` は initial state、last start tag、fragment context、scripting flag など、suite が入力として扱う実行条件を含む。`expected` は expected token、expected tree、expected parse error など、その test が比較に使う期待値全体を含む。

case ID は各 case result と report 内の参照に使用する。

## 集計単位

html5lib tokenizer tests は suite 全体、relative fixture file、initial state を集計単位とする。将来追加する test suite は、その suite が持つ実行条件と結果項目を集計単位として定義する。

## 実行フロー

1. `conformance.json` と fixture root から、使用する fixture revision を確定する。
   - ローカルに対象レポジトリがなければ git clone なども行う
2. Vitest が palim repository の html5lib tokenizer test implementation を実行する。
3. test implementation が `.test` fixture を実行単位へ展開し、palim tokenizer を呼び出して expected / actual comparison と status 判定を行う。
4. 確定した結果をpalimの記録形式へ変換し、JSON Lines へ逐次書き出す。
5. 全 suite 終了後に記録済み結果から summary を生成する。

test 単位の例外と timeout は html5lib tokenizer test implementation で処理する。test process 自体の異常終了と timeout は orchestration 側で記録し、fixture format が定める比較規則は test implementation が実装する。

## 結果形式

run metadata と case result を分離する。

```text
tmp/measurements/compliance/<run-id>/
  run.json
  cases.jsonl
  summary.json
  summary.md

reports/measurements/compliance/
  report.json
  report.md
```

`run.json` は palim revision、fixture revision、Node.js、V8、OS、profile、feature flags、harness schema version を持つ。

`cases.jsonl` の各行は少なくとも次を持つ。

- suite、case ID、relative fixture file name、suite 固有の入力条件と集計項目
- profile と feature flags
- status
- duration と timeout limit
- failure 時の expected / actual の参照
- skip、unsupported の理由

大きな expected / actual dump は別ファイルへ置き、JSON Lines には path と digest を記録する。

`tmp/measurements/compliance/<run-id>/` は実行中の詳細確認と report の再生成に使う raw artifact であり、version 管理しない。

`reports/measurements/compliance/report.json` は比較・追跡に必要な最終結果として version 管理する。run ごとの report file を repository に蓄積しない。

`report.json` は少なくとも次を持つ。

- report schema version
- candidate と比較対象の palim revision
- `conformance.json` の内容と各 fixture revision
- 対象 profile と feature flags
- status 別、suite 別、suite 固有項目別の集計
- unexpected pass、stale expectation に該当する case ID、relative fixture file name、input、expected、status
- test case 数

`report.md` は `report.json` から生成スクリプトによって作成する。

## 自動実行との接続

想定 command は次とする。

```sh
npm run conformance
npm run conformance:sync
npm run conformance:test
npm run conformance:report
```

- `conformance:sync` では conformance.json にしたがって 対象レポジトリをチェックアウトする．存在しているなら何もしない
- `conformance:sync:force` では conformance.json にしたがってチェックアウトするまえに，削除をおこなってクリーンな状態から行う
- `conformance:test` では conformance のテストを実行し，レポート用のデータも生成する
- `conformance:report` では生成済みのレポート用のデータから人が読む最終レポートを生成する
- `conformance` では sync, test, report を連続で実行する

commit、push、PR、定期実行、release のどこから各 mode を呼ぶか、失敗を変更の統合条件にするかは開発フローを定める別の ADR に従って決める

## 参考資料

- [ADR-0002](../decisions/0002-compliance-measurement.md)
- [html5lib-tests: Tokenizer tests](https://github.com/html5lib/html5lib-tests/tree/master/tokenizer)
