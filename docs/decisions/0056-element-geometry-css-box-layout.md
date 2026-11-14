# ADR-0056: Element geometry のための CSS box layout

## ステータス

accepted

## コンテキスト

palim は DOM tree と inline style の宣言値を保持するが、stylesheet の cascade、computed value、CSS box の生成、layout、および viewport 上の座標を計算しない。

CSSOM View の `Element.getClientRects()` は Element が生成した box fragment の border edge を返し、`Element.getBoundingClientRect()` はその矩形を包含する矩形を返す。
CSSOM View は、関連する box がない Element の返り値を規定しているが、palim が CSS box を計算していないことは、Element が仕様上 box を生成しないことを意味しない。
通常なら box を生成する Element に、layout 未実装を理由として関連する box がない場合の処理にはできない。

Element geometry API を追加するには、DOM tree、stylesheet、inline style、および viewport から CSS box fragment と座標を計算し、その結果を Element から取得できる構成が必要である。

## 決定

- `@palim/core` は DOM tree、style attribute、および Geometry Interfaces の矩形値を提供し、CSS cascade と layout を実行しない
- `@palim/css` を追加し、stylesheet の cascade、computed value、CSS box の生成、および viewport 上の box 配置を提供する
- `@palim/css` は `@palim/core` が生成した Document と Element を使用し、standard interface を複製しない
- `@palim/window` は active Document と viewport の寸法を所有する
- `palim` は `@palim/window` が所有する Document および viewport と `@palim/css` を組み立てる
- Element geometry は `@palim/css` が生成した box fragment と viewport 座標を使用し、CSSOM View に従う
- box の有無は computed `display`、document への接続状態、および CSS の box 生成規則から決定する
- `@palim/scripting` は Geometry Interfaces と CSSOM View の Element 拡張を page realm に公開し、realm identity を維持する
- DOM tree 上の位置や inline style の指定値だけから座標と寸法を推測しない

## 影響

- `palim` package に `@palim/css` の依存と初期化処理が追加される
- stylesheet の変更、style attribute の変更、DOM mutation、および viewport の変更で layout 結果を再計算する必要がある
- Element geometry の結果は実際の box fragment と viewport 座標に基づく
- box を生成しない Element と、palim がまだ対応していない layout 規則を区別して扱う必要がある
- paint、hit testing、scrolling、focus navigation、および Web Animations はこの決定だけでは実装されない

## 代替案

### 全 Element に空の client rect list を返す

layout を計算できないことと、Element が仕様上 box を生成しないことを同一視するため採用しない。

### inline style の指定値から座標と寸法を返す

cascade、継承、containing block、font metrics、fragmentation、および viewport を考慮しない値になり、CSS box の結果として扱えないため採用しない。

### geometry API を layout より先に追加する

通常なら box を生成する Element に誤った空 list と全値 0 の矩形を返すか、仕様に存在しない placeholder 値を返すことになるため採用しない。

## 参考資料

- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0041](./0041-web-idl-realm-binding-boundary.md)
- [ADR-0046](./0046-multi-package-capability-boundaries.md)
- [ADR-0054](./0054-wpt-spec-conformance-plan.md)
- [CSSOM View Module: Extensions to the Element Interface](https://drafts.csswg.org/cssom-view/#extensions-to-the-element-interface)
- [CSS Display Module: Box Generation](https://drafts.csswg.org/css-display/#box-generation)
- [CSS Cascading and Inheritance](https://drafts.csswg.org/css-cascade/)
- [Geometry Interfaces Module](https://drafts.fxtf.org/geometry/)
