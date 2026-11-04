# ADR-0039 Design log: Mozilla Readability との相互運用性検証

## 目的

ADR-0039 で決定する二段階の相互運用性検証を、project test と conformance test へ接続できる粒度に整理する。
検証対象、依存と fixture の固定方法、および公開 API だけを使用する原則は ADR-0039 に置き、この文書には実行条件、比較方法、結果形式、および完了条件を記録する。

## 固定する対象

### Readability package

最初の検証対象は `@mozilla/readability` 0.6.0 とする。
`devDependencies` には range を使用せず exact version を指定し、`package-lock.json` の resolved artifact と integrity を保持する。

Readability package の更新だけを行う変更では corpus revision を同時に変更しない。
更新後の出力差を確認してから、必要であれば corpus revision を別の変更で更新する。

### Upstream fixture

Readability repository の `test/test-pages` にある各 directory を一つの corpus case とする。
各 case では次の file を使用する。

- `source.html`
- `expected.html`
- `expected-metadata.json`

Readability repository は `conformance/conformance.json` に repository URL と commit SHA を記録し、`tools/conformance/sync.sh` で `conformance/` 配下へ取得する。
fixture は `node_modules` や通常の dependency install に含めない。

package version に対応する release tag と fixture commit の関係を、manifest または生成する run metadata から確認できるようにする。

## Connection test

connection test は palim repository が管理する小さな fixture を使用し、通常の project test に含める。
一つの fixture へ多くの条件を詰め込まず、失敗した公開 API の境界を case 単位で特定できるようにする。

少なくとも次を個別に確認する。

- `DOMParser` が生成した `Document` を `Readability` に渡せる
- `document.cloneNode(true)` が返した `Document` を `Readability` に渡せる
- `Readability.parse()` が記事本文、title、byline、および excerpt を返す
- relative URL が document URL または base URL を基準に解決される
- `isProbablyReaderable()` が同じ種類の `Document` を処理できる

connection test は外部 corpus を必要とせず、通常の project test だけで再現できる状態を保つ。

## Compatibility test

compatibility test は固定した upstream corpus の全 case を conformance test として実行する。
palim project が規定する test runner を使用し、upstream の Mocha test を直接起動しない。

各 case では次の順序で処理する。

1. `source.html`、`expected.html`、および `expected-metadata.json` を読み込む
2. palim の公開 API で source 用の新しい `Document` を生成する
3. 入力 document から comment node を除去する
4. `classesToPreserve: ["caption"]` を指定して `Readability.parse()` を呼び出す
5. content と metadata を期待結果と比較する
6. case result と failure detail を記録する

Readability は入力 DOM を変更するため、case 間で `Document` を共有しない。
個別 case の再実行でも、全件実行と同じ入力条件と比較規則を使用する。

## Document の生成条件

upstream test と同じく document URL を `http://fakehost/test/page.html` に固定する。
この URL は palim の公開 API から設定し、`documentURI` および `baseURI` として観測できる必要がある。

URL を設定できる script-disabled な公開経路が存在しない場合、fixture へ `base` element を追加したり内部の document state を変更したりせず、接続条件の不足として記録する。

network access、page script の実行、および外部 resource の読み込みは行わない。
入力 document の comment node は upstream の jsdom 経路と同じく Readability の実行前に除去する。

## Content の比較

`Readability.parse()` が返す `content` と `expected.html` は serialized HTML の byte 列として比較しない。
両方を同じ document 生成経路で DOM として parse し、upstream test の比較規則に合わせて tree order で比較する。

比較では次を適用する。

- 空白だけの text node を比較から除外する
- text node 内の連続する空白を一つの空白へ正規化する
- node type と tree order を比較する
- element の local name、`id`、および `className` を比較する
- element の attribute の数、名前、および値を比較する
- text node の正規化後の内容を比較する

attribute order や空白だけの差を content mismatch にしない一方、node、attribute、または text の差は許容値として読み替えない。

## Metadata の比較

次の値は `expected-metadata.json` と厳密に比較する。

- `title`
- `byline`
- `excerpt`
- `siteName`

次の値は upstream fixture が期待値を持つ場合に厳密に比較する。

- `dir`
- `lang`
- `publishedTime`

## 結果の分類

各 corpus case は次のいずれかに分類する。

- `pass`: content と対象 metadata がすべて一致した
- `connection-error`: Readability が必要とする公開 DOM API または document 設定がなく、実行を開始または継続できなかった
- `null-result`: `parse()` が記事を返さなかった
- `content-mismatch`: 記事は返ったが content tree が一致しなかった
- `metadata-mismatch`: content tree は一致したが対象 metadata が一致しなかった
- `fixture-error`: fixture の取得または読み込みに失敗した

複数の不一致がある場合は case detail にすべて記録する。
集計上は `connection-error`、`null-result`、`content-mismatch`、`metadata-mismatch` の順に最初に該当した分類を使用する。
`fixture-error` は corpus result ではなく run 自体の不成立としても集計する。

## 結果の保存

Readability の compatibility test は既存の conformance reporter に安定した suite key `readability` で結果を渡す。
通常の conformance case status と Readability 固有の failure classification を分離し、次の対応とする。

- `pass` は conformance status `pass` とする
- `null-result`、`content-mismatch`、および `metadata-mismatch` は conformance status `fail` とし、個別の failure classification を保持する
- `connection-error` は conformance status `error` とし、failure classification と例外情報を保持する
- `fixture-error` は case failure ではなく run error として記録する

全 corpus の実行では、既存の conformance reporter が次を生成する。

```text
tmp/conformance/<session-id>/
  results.jsonl
  run.json
reports/conformance/
  report.json
  report.md
```

`results.jsonl` には case ごとの raw result、`run.json` には実行条件と report の出力先を記録する。
`reports/conformance/report.json` には他の conformance suite と分離した `readability` 集計を含め、`report.md` は同じ JSON から決定的に生成する。

機械可読な run metadata と report には少なくとも次を記録する。

- `@mozilla/readability` version
- package lock で固定した integrity
- fixture commit SHA
- palim revision
- Node.js version
- harness schema version

case result には少なくとも次を記録する。

- corpus 内の relative directory を使った case ID
- status
- failure classification
- 最初の不一致
- content と metadata の不一致詳細

同じ case result から、全 case 数、`pass` 件数、および分類別件数を含む人間向けレポートを決定的に生成する。
connection error や既知の未実装 API を全 case 数から除外しない。

`report.json` の `readability` 集計には少なくとも次を含める。

- 全 corpus case 数
- 実行 case 数
- `pass` 件数
- conformance status 別件数
- Readability 固有の failure classification 別件数
- `pass` 件数を全 corpus case 数で割った成功率
- 非 `pass` case の case ID、fixture directory、および failure classification

`report.md` では同じ値を表として表示し、非 `pass` case を classification ごとに参照できるようにする。

個別 case の調査実行は継続的なレポートを更新しない。
固定 revision の全 corpus を実行し、run が成立した場合だけ継続的なレポートを更新する。

## 完了条件

- `@mozilla/readability` が exact version の `devDependency` として固定されている
- Readability fixture の repository と commit SHA が `conformance/conformance.json` に記録されている
- connection test が外部 corpus なしで通常の project test から実行できる
- upstream corpus 全件が conformance test から実行できる
- Readability source、fixture、または palim の内部状態を変更せずに検証している
- case ごとの分類と不一致詳細を確認できる
- 全 corpus の実行によって `reports/conformance/report.json` と `reports/conformance/report.md` が生成される
- conformance report で Readability の件数、成功率、status、および failure classification を他の suite と分離して確認できる

## 参考資料

- [ADR-0039](../decisions/0039-readability-interoperability-verification.md)
- [ADR-0002 Design log](./0002-compliance-measurement.md)
- [Mozilla Readability 0.6.0 test runner](https://github.com/mozilla/readability/blob/0.6.0/test/test-readability.js)
- [Mozilla Readability 0.6.0 test pages](https://github.com/mozilla/readability/tree/0.6.0/test/test-pages)
