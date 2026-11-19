# ADR-0064: constructable stylesheet の置換

## ステータス

accepted

## コンテキスト

palim は `style` element に関連する stylesheet と、page script が生成する `CSSStyleSheet` object を提供している。
`style` element に関連する stylesheet は element の text と rule を相互に反映するが、page script が生成した stylesheet の内容を stylesheet text から置き換える機能は提供していない。

Constructable stylesheet は owner element を持たず、生成時の Document と base URL に関連付けられる。stylesheet text の置換では新しい rule を同じ stylesheet に設定し、以前の rule を stylesheet から切り離す必要がある。

このため、element の text を source とする既存の stylesheet と constructable stylesheet の state を区別し、stylesheet text の置換結果を CSSOM の参照と style 計算で共有する方法を定める必要がある。

## 決定

- page script が生成した `CSSStyleSheet` に同期および非同期の stylesheet text 置換を提供する
- constructable stylesheet は生成した Window の Document と base URL に関連付ける
- stylesheet text の置換によって生成した rule は同じ stylesheet に属し、以前の rule は stylesheet から切り離す
- stylesheet text に含まれる import rule は network request を開始せず、置換後の rule に含めない
- 置換後の rule を selector matching、cascade、および computed value に反映する
- element に関連する stylesheet では constructable stylesheet 専用の置換を許可しない
- Document または ShadowRoot への constructable stylesheet の採用は別の決定で扱う

## 影響

- owner element を持つかどうかだけでなく、stylesheet の生成方法と生成時の Document を保持する必要がある
- stylesheet の全置換後も `CSSStyleSheet` と `CSSRuleList` の identity を維持し、既存の rule object は親 stylesheet を持たなくなる
- stylesheet text の解析には生成時の base URL を使用する
- constructable stylesheet を Document または ShadowRoot の style 計算へ採用する機能は追加されない

## 代替案

### owner element の text を更新する処理を constructable stylesheet に流用する

Constructable stylesheet は owner element を持たず、生成時の Document、base URL、および置換前の rule の切り離しを扱えないため採用しない。

### 同期的な置換だけを提供する

同じ stylesheet text 置換に対して同期 API と非同期 API で異なる state 管理を持つことになるため採用しない。

### import rule の resource を読み込む

Constructable stylesheet の置換では import rule を除去する仕様であり、stylesheet replacement に network loading を導入することになるため採用しない。

## 参考資料

- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0041](./0041-web-idl-realm-binding-boundary.md)
- [ADR-0059](./0059-cssom-stylesheet-objects.md)
- [CSS Object Model](https://drafts.csswg.org/cssom/)
