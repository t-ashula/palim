# DOM 仕様適合性監査の作業方針

## 位置づけ

この文書は DOM の実装状況と検証状況を調査する手順を定める。
WPT の URL を順番に処理するための手順ではない。

WPT は page realm と周辺 capability を含む統合結果として扱う。
DOM の仕様適合性は、仕様上の behavior を起点に、DOM implementation、package interface、realm binding、および統合経路を個別に確認する。

## 目的

- DOM の状態と standard algorithm が実装されているか確認する
- package interface と page realm が同じ implementation と状態へ接続されているか確認する
- Web IDL と realm 固有の処理を DOM algorithm の結果から分離して確認する
- 未実装、実装途中、未検証、blocker、および仕様と test の不一致を区別する
- WPT の結果から DOM implementation について判断できる範囲を明示する

## 計測単位

計測単位は仕様に記述された一つの behavior とする。
一つの behavior は、入力、事前状態、実行する operation、成功時の結果、失敗条件、および観測可能な状態変化を記述できる粒度にする。

次の単位をそのまま behavior としない。

- WPT file または URL
- interface 全体
- 実装 module または source file
- 公開 method が存在するという事実
- TODO の見出しだけで示された広い機能領域

一つの WPT file が複数の behavior を検証する場合は分けて記録する。
複数の WPT または fixture が同じ behavior を検証する場合は、一つの behavior に複数の外部 evidence を関連付ける。

## 検証する層

### 1. DOM implementation

engine に依存しない状態と standard algorithm を確認する。

- tree と attribute の状態変化
- node の owner document と接続状態
- live collection、range、iterator、および observer への影響
- algorithm が定める検査順序と失敗条件
- DOMException の種類

### 2. Package interface

package が公開する interface から同じ DOM implementation へ到達できることを確認する。

- 公開 member の有無
- caller の値から domain operation への変換
- 戻り値の interface object への変換
- 同じ implementation object に対する object identity
- package 公開経路だけに存在する独自の状態や algorithm がないこと

### 3. Web IDL と realm binding

DOM algorithm ではなく、Web IDL と realm に属する処理を確認する。

- required、optional、nullable、dictionary、sequence、および callback の変換
- receiver と brand check
- constructor、prototype、member placement、および property descriptor
- interface exposure と継承関係
- SameObject、iterable、indexed property、および named property
- callback と exception の realm
- realm 内および realm 間の wrapper identity

### 4. Window と lifecycle の統合

DOM implementation と binding を利用する周辺処理を確認する。

- active Document と Window の関連
- parsing と dynamic markup insertion
- script、task、および microtask
- resource loading と child browsing context
- navigation、session history、および document replacement

この層の不足を、DOM algorithm 自体の不足として扱わない。

### 5. WPT による相互運用性

固定した WPT revision で page realm を含む統合結果を確認する。
WPT の結果は上の各層を横断する evidence であり、単独で特定層の適合を証明しない。

## Status

### Implementation status

- `present`: 対象 behavior を実行する実装経路が存在する
- `partial`: behavior の一部だけを実行できる、または必要な状態更新が不足する
- `absent`: 対象 behavior の実装経路が存在しない

### Verification status

- `verified`: 対象層について必要な evidence が揃い、仕様上の結果を確認できる
- `failed`: 実行できるが仕様上の結果と一致しない
- `unverified`: 実装の有無にかかわらず、必要な case または evidence がない
- `blocked`: 別の capability または実行環境の問題により対象層を評価できない
- `ambiguous`: Living Standard、fixture、または test の期待が一致せず判定を確定できない

`present` と `verified` は独立して記録する。
source に method が存在するだけの場合は `present` になり得るが、`verified` にはしない。

## Behavior manifest

各 behavior について、少なくとも次を機械可読な manifest に記録する。

- 安定した behavior ID
- 仕様名、section、および algorithm
- behavior の入力、事前状態、operation、および観測項目
- 対象 interface と member
- 関係する implementation operation
- package interface の公開経路
- page realm の公開経路
- Web IDL fixture または interface definition
- 外部 fixture と WPT URL
- 前提 behavior と周辺 capability
- 層ごとの implementation status と verification status
- failure、blocker、または ambiguous とした理由
- evidence の test case ID と結果

対象仕様領域内の behavior は、既存 test がないという理由で manifest から除外しない。
最初の監査で全 behavior を同時に列挙せず、対象仕様領域ごとに母数と範囲を固定して追加する。

## Evidence

### 外部 fixture

固定 revision の upstream fixture が behavior を直接検証できる場合は優先して使用する。
fixture の入力、期待結果、および比較規則を維持し、palim の実装状況に合わせて変更しない。

### Project test

project test は次を検証する。

- package interface と implementation の接続
- page realm と同じ implementation の接続
- realm identity と exception の所属
- module の依存方向
- upstream fixture が扱わない仕様上の分岐

既存実装と同じ処理を test 側に再実装して期待値を生成しない。

### 共通 behavior case

package interface と page realm の両方に公開する behavior は、同じ case 定義を各経路へ適用する。
case は少なくとも次を比較できる形にする。

- 戻り値または例外の種類
- mutation 後の tree と関連状態
- live object から観測される変更
- object identity
- callback の呼び出しと順序
- page realm から観測される exception の `name` と必要な属性

host JavaScript object と page realm object の `instanceof` を直接一致条件にしない。

## `verified` の判定

対象層を `verified` とするには、次を満たす必要がある。

- normative な仕様参照と対象 behavior が対応している
- success、failure、および観測可能な状態変化に必要な case がある
- 対象層の公開経路から case を実行している
- 対象層より外側の capability に結果を依存させていない、または依存を明記している
- failure を pass 扱いにする除外や palim 固有の期待値変更がない
- applicable な外部 fixture または WPT が存在する場合は結果を関連付け、その意味を分類している

applicable な WPT が存在しないことだけを理由に `unverified` とはしない。
DOM behavior を直接評価できる fixture と project test が揃っていれば、その層は `verified` にできる。
WPT の統合層は別 status として残す。

## WPT failure の分類

対象 WPT の failure は、調査後に次のいずれかへ分類する。

- `dom-algorithm`: DOM の状態または standard algorithm の不一致
- `package-interface`: package の公開経路または implementation への接続不足
- `webidl-binding`: conversion、descriptor、exposure、callback、exception、または identity の不一致
- `window-integration`: Window、Document lifecycle、script、task、resource、または navigation の不足
- `external-capability`: CSS、layout、network、storage、media など対象 DOM behavior の外側にある不足
- `runner-harness`: runner、testharness、timeout、または engine parser の問題
- `spec-test-mismatch`: Living Standard と固定 fixture または WPT の期待の不一致
- `unclassified`: 調査前、または原因をまだ分離できていない

`external-capability`、`runner-harness`、および `spec-test-mismatch` を DOM algorithm の failure 数へ含めない。
`unclassified` を pass または unsupported とみなさない。

## 監査手順

### 1. 対象仕様領域を固定する

初期対象は `Node`、`Element`、`Document` の tree mutation とする。
対象 section、含める behavior、および対象外領域を変更前に記録する。

### 2. Behavior を列挙する

Living Standard の algorithm と関連 Web IDL から behavior を列挙し、behavior ID を付ける。
既存 source や test に存在する項目だけを列挙しない。

### 3. 現在の経路を対応付ける

各 behavior に implementation、package interface、page realm binding、project test、外部 fixture、および WPT を対応付ける。
対応先がない項目も空欄にせず、`absent` または `unverified` と理由を記録する。

### 4. 読み取り可能な evidence を評価する

既存 test と固定 fixture の結果から層ごとの status を決める。
この段階では、WPT failure を解消するための実装変更を行わない。

### 5. Gap を作業単位へ変換する

一つの作業項目は一つの behavior と、適合に必要な層だけを対象にする。
同じ behavior の standard algorithm、package interface、および page realm 接続は、分断すると経路差を残す場合に限り一つの変更範囲として扱う。
独立した周辺 capability は別項目にする。

### 6. 修正後に全経路を再評価する

変更した層だけでなく、manifest が関連付ける内側と外側の経路を再確認する。
WPT が別の failure へ進んだ場合は改善の evidence として記録するが、それだけで behavior を `verified` にしない。

## 初期監査の完了条件

- tree mutation の対象 section と behavior の母数が記録されている
- 各 behavior に implementation と公開経路が対応付けられている
- package interface と page realm の検証状況が分離されている
- Web IDL と DOM algorithm の failure が分離されている
- WPT failure に分類または `unclassified` が明記されている
- `present` だが `unverified` の項目が欠落せずに残っている
- 次の実装項目を WPT report の順番ではなく、behavior の依存関係から選べる

## 関連文書

- [ADR-0002: 仕様準拠度の継続計測](./decisions/0002-compliance-measurement.md)
- [ADR-0025: DOM interface、binding、implementation の分離](./decisions/0025-dom-interface-binding-implementation.md)
- [ADR-0041: Web IDL realm binding の実装境界と分割](./decisions/0041-web-idl-realm-binding-boundary.md)
- [ADR-0045: WPT 対象範囲の拡張](./decisions/0045-expand-wpt-scope-for-exposed-web-apis.md)
- [ADR-0053: DOM 仕様適合性の層別計測](./decisions/0053-layered-dom-conformance-measurement.md)
- [WPT 適合度改善の作業方針](./wpt-conformance-workflow.md)
