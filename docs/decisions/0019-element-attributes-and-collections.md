# ADR-0019: Element attribute reflection と collection API の追加

## ステータス

accepted

## コンテキスト

palim の `Element` は attribute の取得、設定、および削除を行えるが、`id`、`className`、および `classList` を公開していない。
`NamedNodeMap` は attribute list の参照と列挙のみを行い、名前による取得、設定、および削除を行えない。

attribute の変更処理は `Element` 内にあり、`NamedNodeMap` から共有できる形になっていない。
このまま `NamedNodeMap` に変更処理を追加すると、attribute の置換、`ownerElement` の更新、および例外処理が別経路になる。

また、既存の `DOMTokenList` は HTML element 実装に含まれている。
core DOM の `Element.classList` から使用するには、DOM 層から HTML element 層への依存を作らない配置へ変更する必要がある。

## 決定

- `Element.classList` と HTML element の token list が共有する `DOMTokenList` 実装を DOM 層へ移す
- `Element` と `NamedNodeMap` が attribute の取得、設定、置換、および削除を行う内部処理を共有する
- `Element.classList`、`Element.id`、`Element.className`、および `NamedNodeMap` の未実装 API を同じ実装単位として追加する
- 公開 API を通す project test を作成し、WHATWG DOM の algorithm を期待結果の根拠とする

## 影響

- core DOM から HTML element 実装への依存を追加せずに `classList` を公開できる
- `Element` と `NamedNodeMap` で attribute の所有関係と置換処理を共通に保てる
- HTML element の既存 token list と `classList` が同じ token validation と attribute 更新処理を使用できる

## 代替案

### `DOMTokenList` を HTML element 実装に残す

core DOM から HTML element 層への依存が必要になるため採用しない。

### `classList` 専用の token list を追加する

既存の HTML element 用 `DOMTokenList` と token validation および attribute 更新処理が重複するため採用しない。

### `NamedNodeMap` が attribute list を直接変更する

`Element` の attribute mutation と異なる更新経路になり、attribute の所有関係を別々に管理することになるため採用しない。

## 参考資料

- [WHATWG DOM: `Element`](https://dom.spec.whatwg.org/#interface-element)
- [WHATWG DOM: `NamedNodeMap`](https://dom.spec.whatwg.org/#interface-namednodemap)
- [WHATWG DOM: `DOMTokenList`](https://dom.spec.whatwg.org/#interface-domtokenlist)
