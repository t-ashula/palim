# ADR-0022: Range の生成と live mutation 連携

## ステータス

accepted

## コンテキスト

palim は `Range` と `Document.createRange()` を持たない。

`Range` の boundary point は node tree と character data の変更に追従するため、range 内の処理だけでは完結しない。
現在の node insertion、node removal、character data replacement、および normalization はそれぞれ既存の DOM mutation 処理を通るため、個別の公開 API から range を更新すると同じ調整が重複する。

また、palim は `Window` と global object に関連付けられた `Document` を持たないため、引数を持たない `Range` constructor の初期 document を決定できない。

## 決定

- `Range` の公開 interface と実装 class を分離し、実装 class は package export に含めない
- runtime での生成経路は `Document.createRange()` と `Range` の複製操作に限定する
- global object に関連付けられた `Document` を導入するまでは、`Range` constructor を公開しない
- live range は node document に関連付けた弱参照の registry で追跡する
- boundary point の調整は node insertion、node removal、character data replacement、および normalization の共通 mutation 処理から呼び出す
- boundary point の比較と tree order の処理は range 実装から分離し、range の各操作で共有する
- project test は `Document.createRange()` から生成した公開 interface のみを使用し、実装 class と mutation hook を直接使用しない
- project test の期待結果は WHATWG DOM の range algorithm を根拠とし、各操作に加えて mutation 後の boundary point も対象にする

## 影響

- `Range` の生存期間を node document が延長せずに mutation へ追従できる
- 既存の DOM mutation 処理へ live range の調整を接続する必要がある
- 同じ mutation が複数の公開 API から実行されても boundary point の調整箇所を共通化できる
- `Window` 導入前は `new Range()` を利用できない

## 代替案

### Document を引数に取る Range constructor を追加する

DOM Standard にない生成 API を公開することになるため採用しない。

### 各 Range 操作の実行時に現在の tree から boundary point を再構築する

range 外で発生した mutation の前後関係を復元できないため採用しない。

### live range を強参照の registry で保持する

利用側から参照されなくなった range の生存期間を node document が延長するため採用しない。

## 参考資料

- [WHATWG DOM: Ranges](https://dom.spec.whatwg.org/#ranges)
- [WHATWG DOM: Interface Range](https://dom.spec.whatwg.org/#interface-range)
- [WHATWG DOM: Mutation algorithms](https://dom.spec.whatwg.org/#mutation-algorithms)
