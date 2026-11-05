# ADR-0041 Design log: Web IDL realm binding の実装境界と分割

## 記録範囲

Web IDL、DOM、URL、および HTML Standard の algorithm はこの文書に転記しない。
palim の package interface、host runtime、standard implementation、および engine realm binding の間で共有するもの、realm ごとに分離するもの、module の依存方向、および移行の完了条件を記録する。

初期対象は `DOMRealmBinding`、`URLRealmBinding`、および `WindowRealmBinding` とする。
将来別の Web IDL interface 群を engine realm へ公開する場合も同じ境界を使用する。

## Layer

| Layer | 責務 | engine 型 |
| --- | --- | --- |
| standard implementation / runtime | DOM、URL、Window environment の状態と algorithm | 使用しない |
| package interface / host adapter | host JavaScript value の Web IDL conversion と host capability | 使用しない |
| interface installer | constructor、prototype、member、descriptor、exposure | opaque handle を context 経由で使用する |
| domain binding context | implementation と realm object の identity、domain 固有接続 | opaque handle を context 経由で使用する |
| `RealmBindingContext` | engine value の conversion、property、callback、exception | opaque handle を使用する |
| engine adapter | realm と engine 固有 value model の操作 | adapter 内だけで使用する |

依存方向は上の domain 実装から engine adapter へ向けない。
realm binding は domain implementation を利用できるが、domain implementation、parser、runtime、および package interface は realm binding を import しない。

## 共有する状態と処理

### DOM

- tree、attribute、event path、live collection、range、traversal、parsing、および serialization の状態と algorithm は engine 非依存の implementation に置く
- package interface と engine realm binding は、変換済みの引数で同じ implementation operation を呼び出す
- realm binding が返す DOM object は、対応する package interface object と同じ implementation object を参照する
- engine realm binding の都合で DOM implementation、collection、iterator、parser、または serializer の domain state を複製しない

### URL

- URL parsing、serialization、mutation、および `URLSearchParams` との関連状態は engine 非依存の URL implementation に置く
- package の `URL` と `URLSearchParams`、DOM hyperlink member、Window location、および engine realm binding は同じ URL implementation を使用する
- iterator の JavaScript object state は realm ごとに分離しても、反復対象の URL state を binding 内へ複製しない
- engine realm binding のために host native URL object または別の URL parser を導入しない

### Window

- Window、Location、environment settings、task、timer scheduling、navigation state、console intervention、および error reporting の所有者を host runtime 側で明示する
- engine realm binding は global object、global this、interface object、および engine callback を runtime の operation へ接続する
- timer ID と scheduling state は Window runtime が所有し、binding は engine callback と realm completion の変換だけを担当する
- Location の URL state は Window environment と URL implementation が所有し、binding 内に別の URL state を保持しない
- console と error reporting は host intervention へ委譲し、binding 内に出力先または error lifecycle を実装しない

package interface method、host adapter、および engine realm operation は、一方を他方から呼ぶことを共有の条件にしない。
それぞれが caller の value を変換した後で同じ domain operation へ委譲する。
これにより host JavaScript の conversion と engine value の conversion を分離しながら、standard algorithm と state を共有する。

## realm ごとの分離

次の object と状態は realm ごとに保持する。

- global object と global this
- interface object と prototype object
- implementation または runtime object に対応する platform object
- platform object の expando property
- JavaScript callback と callback が属する realm
- realm に属する exception object
- engine value を保持する dictionary member または event detail
- iterator result など JavaScript object として観測される実行状態

同じ implementation object を複数 realm に公開した場合、各 realm の platform object は別 object とする。
一つの realm 内では、同じ implementation object を繰り返し取得したときに同じ platform object を返す。
一方の realm の expando property は別 realm または package interface object へ伝播させない。

## 両経路で一致させる観測

### DOM

- tree mutation 後の親子関係と node 順序
- attribute、text、document metadata、および live collection の内容
- selector、traversal、serialization、および parsing の結果
- DOM exception の name と、standard が規定する成功・失敗

### URL

- parse と serialize の結果
- property mutation と `URLSearchParams` の live な相互反映
- iterator が観測する entry の順序と値
- invalid URL と引数変換の成功・失敗

### Window

- active document、location、および environment state
- timer の登録、取消、実行順序、および callback 結果
- console intervention と未処理 error の host への報告
- global interface member の値と navigation state の反映

object identity、prototype identity、constructor identity、expando property、および exception object 自体は realm ごとに異なる。
property descriptor、argument conversion、callback invocation、exception の realm、および global exposure は、それぞれの Web IDL adapter で検証する。

## `RealmBindingContext`

`RealmBindingContext` は、interface installer が engine adapter を直接所有しなくても必要な Web IDL 処理を実行できる capability を提供する。

最低限、次の分類を扱う。

- realm の global object、intrinsic、および well-known symbol の取得
- interface object、prototype、function、constructor、および property の生成
- engine value の primitive conversion と dictionary member の取得
- required、optional、nullable、sequence、record、および callback argument の conversion
- TypeError と domain exception の生成
- callback の呼び出しと abrupt completion の伝播
- iterator protocol の engine value 操作

common context は DOM、URL、Window の state または algorithm を提供しない。
domain receiver の brand check、wrap、unwrap、および identity は domain binding context が提供する。

同じ処理を common context へ移す条件は、Web IDL 上の conversion order、exception、property descriptor、および callback semantics が一致することである。
名前が似ているだけの conversion、Window global の named property、legacy platform object、および interface 固有 constructor steps は別処理のまま保持する。

## Domain binding context

### DOM binding context

- DOM implementation と platform object の双方向 identity
- DOM interface の prototype registry
- DOM object の wrap、unwrap、および receiver brand check
- DOMException の realm object への変換
- event listener と traversal filter の engine callback 接続
- legacy platform object の indexed・named property 接続

### URL binding context

- `URL`、`URLSearchParams`、および iterator と realm object の identity
- URL interface の prototype registry
- URL object の wrap、unwrap、および receiver brand check
- constructor input、sequence、record、および iterator input の変換接続

### Window binding context

- Window environment、global object、および global this の関連付け
- Window、WindowProxy、および Location の receiver brand check
- DOM と URL domain context の composition
- engine callback と runtime task・timer の接続
- console と error reporting の host intervention 接続

domain context は別 domain の implementation を複製しない。
Window が DOM と URL を使用する場合は、それぞれの domain context が生成した object と operation を composition する。

## Interface installer

各 realm binding class は次の処理だけを組み立てる。

1. engine と realm から common context を生成する
2. 必要な domain context と prototype registry を生成する
3. interface installer を依存順に実行する
4. consumer へ domain object の公開 capability を提供する

installer は class 継承ではなく module 関数として構成する。
一つの Web IDL interface を必ず一つの file または class に対応させない。
共通の状態、conversion、prototype 初期化順序、および test 単位が同じものを同じ installer に置く。

初期の分割単位は次を基準とし、file 数を固定しない。

- DOM event、node、element、collection、traversal、parsing、CSSOM、legacy platform object
- URL、URL search params、URL iterator
- Window global、Location、timer、console と error reporting の接続

Window global の member placement と descriptor は通常の interface prototype と異なるため、通常の interface installer に合わせる目的で抽象化しない。

## 機能追加の手順

Web IDL interface の member を追加するときは、次を確認する。

1. standard の algorithm と公開 Web IDL contract を分けて確認する
2. domain の状態または algorithm が不足している場合は engine 非依存の operation を追加する
3. package interface または host adapter から caller の値を変換して同じ operation を呼び出す
4. engine realm installer から engine value を変換して同じ operation を呼び出す
5. 戻り値を caller に対応する interface object、platform object、または primitive へ変換する
6. package または host 側、engine realm、および共有 domain state の接続を検証する

engine realm の WPT を通すためだけに installer 内で domain の結果を組み立てない。
package interface または host runtime にまだ存在しない標準 member を engine realm へ追加する場合も、同じ変更で domain operation と両方の接続を扱う。
global exposure set による非公開は、domain 機能の欠落と区別する。

## 移行順序

1. 三つの realm binding の field と method を、common infrastructure、domain context、interface installer、standard algorithm、realm 固有 state に分類する
2. 現在の結果を維持したまま、property 定義、conversion、exception、および callback の共通処理を `RealmBindingContext` へ抽出する
3. URL binding を common context と URL domain context へ移し、通常の interface と iterator input の contract を検証する
4. DOM の identity、prototype registry、および wrap・unwrap を DOM domain context へ移す
5. DOM interface member の登録を依存単位の installer module へ移す
6. Window binding を common context と Window domain context へ移し、global object 固有処理と DOM・URL composition を分離する
7. installer 内に残った standard algorithm または engine 非依存であるべき state を domain implementation または runtime へ移す
8. binding test を common context、domain context、interface、および host/realm 接続 test に分割する

URL binding を最初の適用先とするのは、通常の interface、constructor、attribute、method、iterator、sequence、および record conversion を含み、Window global より依存範囲が小さいためである。

各段階で公開 API、realm exposure、および standard の結果を変更しない。
挙動変更が必要な不具合を発見した場合は、分割とは別の変更として回帰 test とともに扱う。

Web IDL source からの code generation はこの移行の前提にしない。
installer contract と例外・identity の扱いが安定した後に、生成対象と手書き対象を別途決定する。

## Test

### Common context

- primitive、string、nullable、optional、sequence、record、および dictionary conversion の abrupt completion を caller realm へ返す
- method、attribute、constructor、および property descriptor を指定した realm に生成する
- callback を callback が属する realm で呼び出す
- TypeError と domain exception を caller realm に生成する
- DOM、URL、および Window installer が同じ context contract を使用する

### Identity

- 同じ implementation は同じ realm 内で同じ platform object を返す
- 同じ implementation を異なる realm に公開すると異なる platform object を返す
- 異なる realm の expando property は共有されない
- wrapper の操作結果を共有 implementation または runtime state から観測できる

### DOM connection

- package の `DOMParser` が生成した document を engine realm に公開し、両方向の mutation 結果が一致する
- engine realm の `DOMParser` は package と同じ parser implementation を使用する
- selector、collection、traversal、および serializer が wrapper 固有の複製 state を使用しない
- engine realm の callback を伴う event と traversal が共有 DOM state を更新する

### URL connection

- package と engine realm の `URL` が同じ parsing と serialization の結果を返す
- URL property と `URLSearchParams` の mutation が両方の wrapper から同じ state として観測される
- constructor の string、sequence、record、および iterable input が Web IDL conversion に従う
- hyperlink member と Window location が同じ URL implementation を使用する

### Window connection

- host runtime の active document と location の変更が engine realm の global objectへ反映される
- timer の登録と取消を host runtime が所有し、engine callback を正しい realm で呼び出す
- console と未処理 error が指定した host intervention へ一度だけ報告される
- DOM と URL object が Window binding 内で複製されず、それぞれの domain identity を維持する

WPT は engine realm の Web IDL と web platform の適合性を判定する。
project test は palim 固有の context、identity、依存方向、および host/realm 接続を確認し、WPT の期待値を再実装しない。

## 完了条件

- `DOMRealmBinding`、`URLRealmBinding`、および `WindowRealmBinding` が context と installer の組み立てに限定される
- 三つの realm binding に semantics が同じ property 定義、conversion、callback、および exception helper が重複しない
- domain の各状態と standard algorithm に engine 非依存の実装経路が一つだけ存在する
- package interface、host adapter、および engine realm binding が同じ domain operation または runtime state を使用する
- DOM、URL、Window runtime、parser、selector、serializer、collection、および traversal の module が JavaScript engine module を import しない
- realm ごとの global、wrapper identity、prototype、expando、callback、iterator state、および exception が分離される
- Window global 固有処理、legacy platform object、および interface 固有 constructor steps が common context に隠されない
- interface installer の依存方向に循環がなく、Window は DOM と URL の domain context を composition する
- DOM、URL、および Window の host/realm 接続を project test が確認する
- parser-only の import graph に JavaScript engine が含まれない
- project の format、lint、typecheck、test、および build が成功する

## 参考資料

- [ADR-0041](../decisions/0041-web-idl-realm-binding-boundary.md)
- [ADR-0025](../decisions/0025-dom-interface-binding-implementation.md)
- [ADR-0026 Design log](./0026-javascript-engine-connection.md)
- [ADR-0027 Design log](./0027-window-execution-environment.md)
- [ADR-0029 Design log](./0029-url-standard-implementation.md)
- [ADR-0031 Design log](./0031-document-constructor-boundary.md)
- [WHATWG Web IDL: ECMAScript binding](https://webidl.spec.whatwg.org/#js-binding)
- [WHATWG Web IDL: Platform objects implementing interfaces](https://webidl.spec.whatwg.org/#dfn-platform-object)
- [WHATWG Web IDL: Legacy platform objects](https://webidl.spec.whatwg.org/#legacy-platform-object)
