# ADR-0025: DOM interface、binding、implementation の分離

## ステータス

accepted

## コンテキスト

palim の `Node`、`Element`、`Document`、`Event` などの class は、package が公開する interface object であると同時に、tree、attribute、event dispatch などの内部状態と操作を保持している。

parser、selector、serializer、collection、traversal、および range は、これらの class が持つ `_childNodes`、`_parentNode`、`_attributeNodes`、`_append()`、`_remove()` などを module 間の内部 API として使用している。
この構成では、公開 interface から内部 API を除去できず、内部状態へのアクセス制御にも出来ていない。

JavaScript realm を接続する場合、realm に属する constructor と prototype、DOM object の identity、および callback と例外の realm を扱う binding が必要になる。
現在の class をそのまま realm の global object へ公開すると、DOM の内部実装が特定の JavaScript realm と結合する。

## 決定

- DOM を interface object、binding、および implementation object の三つの責務に分ける
- package が公開する DOM class は interface object とし、DOM の内部状態を保持しない
- tree、attribute、event、および各 DOM algorithm が使用する状態と操作は、package export に含めない implementation object と module 内関数へ移す
- binding は interface object と implementation object の対応、interface object の生成、および object identity を管理する
- interface object の公開 method と accessor は Web IDL 境界の変換を行い、binding を介して implementation の処理へ委譲する
- parser、selector、serializer、および DOM algorithm は implementation object を使用し、interface object の非公開 member を内部 API として使用しない
- parser-only の利用では Window または script engine を読み込まずに binding を生成できる構成にする
- Window と JavaScript realm は同じ implementation を再利用し、realm に対応する binding を追加する構成にする
- project test は package が公開する interface から DOM を操作し、implementation object と binding の内部 API を直接使用しない
- 移行完了後は、class の `_` で始まる field と method を lint error とする

## 影響

- package export に含まれる class から内部 mutation、tree access、および event dispatch 用 member を除去できる
- parser と DOM の内部処理を JavaScript realm および Window から独立させられる
- `instanceof` と object identity を binding の責務として一貫して扱える
- DOM object ごとに interface object と implementation object の対応を保持する必要がある
- interface と implementation の間の委譲に伴う性能とメモリ使用量を計測する必要がある
- core DOM、collection、event、HTML element、parser、selector、および serializer を段階的に移行する必要がある

## 代替案

### `_` member を private field または symbol に置き換える

module 間で内部状態を共有する別の経路が必要になり、公開 class が implementation を兼ねる構成は変わらないため採用しない。

### 公開 class に internal capability interface を実装させる

型として公開 interface から分離できても、runtime object には内部操作が残るため採用しない。

### JavaScript realm ごとに DOM implementation を複製する

DOM algorithm と状態管理が binding ごとに重複し、parser-only の構成も realm 実装へ依存するため採用しない。

## 参考資料

- [ADR-0014](./0014-document-element-creation.md)
- [ADR-0015](./0015-document-node-creation.md)
- [ADR-0021](./0021-dom-traversal.md)
- [ADR-0022](./0022-live-range.md)
- [WHATWG Web IDL: Platform objects implementing interfaces](https://webidl.spec.whatwg.org/#dfn-platform-object)
- [WHATWG HTML: Realms, settings objects, and global objects](https://html.spec.whatwg.org/multipage/webappapis.html#realms-settings-objects-global-objects)
