# ADR-0046: パッケージ分離と capability 合成

## ステータス

accepted

## コンテキスト

palim は HTML parsing と DOM 操作から、Window environment、resource loading、JavaScript execution を含む browser-like environment までを段階的に提供することを目標としている。

現在は parser-only の利用と browser environment の利用が同じ package に含まれている。
module の import graph では JavaScript engine を parser-only の経路から分離しているが、package dependency と配布物の境界には反映されていない。
この構成では、DOMParser だけを必要とする利用者も browser environment と特定 JavaScript engine の dependency を同時に取得する。

一方、DOMParser が返す Document は HTML/XML parser、DOM implementation、selector、URL などを必要とする。
core package の公開機能を DOMParser に限定することと、その内部実装を単純な parser だけに限定することは同じではない。

今後 capability を追加するときに、下位 layer の dependency、公開 API、object identity、および browser environment の構築方法を安定して管理できる package 境界が必要である。

## 決定

### package の役割

- repository を複数 package で構成する
- `@palim/core` を parser-only 利用の package とし、DOMParser を公開 API とする
- DOMParser の戻り値を型として扱うために必要な DOM interface は、`@palim/core` から type-only API として公開する
- `@palim/core` は DOMParser の動作に必要な HTML/XML parsing、DOM implementation、selector、および URL 処理とする
- Window environment、resource loading、JavaScript realm binding、および JavaScript engine backend は `@palim/core` に含めない
- `palim` を browser-compatible な full package とし、`@palim/core` と必要な capability package を組み立てる
- `palim` は `@palim/core` の DOMParser を再公開し、browser environment を生成する `open()` も export する
- 中間 capability package の具体的な名前と分割単位は、それぞれの依存境界を定める後続 ADR で扱う

### 依存方向

- package dependency を循環させないようにする
- 下位 package は上位 capability package と full package に依存しない
- JavaScript engine の interface と backend implementation を分離し、engine 固有 dependency は backend package だけが持つ
- full package が使用する capability と engine backend を明示的に選択し、factory または constructor injection によって組み立てる
- capability package の import を契機とした global object、既存 prototype、または既存 instance への暗黙の機能追加を行わない
- capability の有無や挙動を module の import 順序に依存させない

### object identity と内部 API

- 上位 package は下位 package が生成した DOM implementation と interface object を共有し、同じ standard interface の実装を package ごとに複製しない
- realm、`instanceof`、WeakMap による関連付け、および platform object identity が複数 package 間で維持される構成にする
- 上位 package が下位 package の非公開操作を呼び出すための API は、package の `exports` に専用の internal subpath として列挙し、一般利用者向けの export と区別する
- package 群は同一 release version で管理し、full package は互換性を確認した同一 version の capability package を使用する

### export と移行

- `@palim/core` package の `@palim/core` という import path は DOMParser を export し、`open()` を export しない
- `palim` package の `palim` という import path は DOMParser と `open()` を export する
- `palim` は Window や engine environment を直接生成する関数と class を export しない
- 現在の `palim` package は full package へ移行し、parser-only の利用先として `@palim/core` を追加する
- package 分離は挙動変更と分けて段階的に行い、最初に JavaScript engine backend の直接生成を browser runtime から分離する
- 既存の公開 export の維持、廃止、および移行期間は、package ごとの公開 API を定める後続 ADR で扱う

### 検証境界

- `@palim/core` の import と DOMParser の実行が JavaScript engine package なしで成立することを継続的に検証する
- source file への直接 import だけでなく、各 package の配布 artifact と `exports` を使用して package boundary を検証する
- full package の browser environment と page realm は、配布 artifact から `open()` を import して生成した環境を使用して適合度を検証する

## 影響

- DOMParser だけを必要とする利用者は browser environment と JavaScript engine backend を dependency に含めずに済む
- full package の利用者は capability package の構成を意識せずに browser environment を利用できる
- JavaScript engine backend の交換と追加を parser および DOM implementation から分離できる
- capability の追加が package dependency と公開 API に明示される
- core package は公開 value API を限定しても DOMParser が返す Document の挙動に必要な実装を含むため、単純な parser だけの配布物にはならない
- package manifest、build、型定義、artifact、version、および test の管理対象が増える
- package 間の internal API にも互換性管理が必要になる
- package が重複して install された場合の object identity 破壊を防ぐため、version と dependency graph の検証が必要になる
- package 分離に伴う import path の変更は利用者にとって破壊的変更になり得る

## 代替案

### 単一 package と subpath exports を維持する

DOMParser と `open()` の import path は分けられるが、JavaScript engine を含む dependency と配布物を parser-only の利用から分離できないため採用しない。

### capability package の import によって既存 object を拡張する

import 順序、複数 version、realm、および object identity によって挙動が変わり、full package の構成も追跡しにくくなるため採用しない。

### 各 package を独立した version で公開する

初期段階では internal API と object identity の変更が複数 package にまたがる。互換性のある組み合わせを個別に管理する負担が大きいため採用しない。

## 参考資料

- [ADR-0005](./0005-dom-parser.md)
- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0026](./0026-javascript-engine-connection.md)
- [ADR-0031](./0031-document-constructor-boundary.md)
- [ADR-0034](./0034-window-host-execution-entry-point.md)
