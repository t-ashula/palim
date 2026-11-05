# ADR-0041: Web IDL realm binding の実装境界と分割

## ステータス

accepted

## コンテキスト

ADR-0025 は DOM の interface、binding、および implementation を分離し、ADR-0026 は JavaScript engine を adapter の背後へ分離した。
ADR-0027 と ADR-0029 は Window と URL についても engine 非依存の environment または implementation を使用する方針を定めている。

一方、engine realm に Web IDL interface を公開する処理と、各 standard の状態および algorithm を接続する処理の境界は定めていない。
現在の DOM、URL、および Window realm binding では、これらの責務が同じ境界に置かれている。

この構成では同じ Web IDL 処理が binding ごとに重複し、機能追加が特定 realm binding だけに実装されやすい。
package interface、Window runtime、および engine realm の間で、利用可能な機能または standard algorithm の結果が分かれることを防ぐ必要がある。

## 決定

- DOM、URL、および Window の状態と standard algorithm は JavaScript engine に依存しない implementation または runtime に一度だけ実装する
- package interface、host runtime、および engine realm binding は同じ状態と standard algorithm を使用し、engine realm binding 内にそれらを複製しない
- realm binding は engine value の conversion、receiver の検査、constructor と prototype、property descriptor、callback、exception、および realm ごとの object identity を担当する
- DOM、URL、および Window binding で semantics が同じ Web IDL 処理は共有し、global interface、legacy platform object、iterator、および interface 固有 constructor steps を無理に共通化しない
- package object、host runtime object、および各 engine realm の object は必要に応じて異なる wrapper とし、共有すべき implementation または environment state に関連付ける
- expando property、constructor、prototype、callback handle、exception object、および engine iterator state は realm ごとに分離する
- interface の追加では、standard algorithm、package または host 側の接続、engine realm exposure、および両経路の接続試験を同じ変更範囲として扱う
- 責務の分離だけを目的として公開 API、standard の挙動、realm exposure、または依存 package を変更しない

## 影響

- DOM、URL、および Window の各 binding で重複している Web IDL infrastructure を一つの規則で保守できる
- package または host 側と engine realm 側が同じ状態と algorithm を使用することを依存構造として維持できる
- realm ごとの差を wrapper identity と Web IDL の realm 固有処理に限定できる
- 既存の realm binding が持つ処理を、standard の状態と algorithm、Web IDL 境界、および realm 固有状態に分類する必要がある
- Window global と legacy platform object の特殊な property semantics を共通化対象から区別する必要がある
- package、host runtime、および engine realm の接続を継続的に検証する必要がある
- 共通化が過剰になると Web IDL の interface 固有規則を隠すため、共有範囲を継続的に監査する必要がある

## 代替案

### package、host runtime、および engine realm の機能を独立して実装する

standard algorithm、状態、および不具合修正が二重化し、同じ environment または implementation に対する観測結果を維持できないため採用しない。

### host object を engine realm へ直接公開する

realm ごとの constructor、prototype、exception、callback、および object identity を維持できないため採用しない。

### すべての binding 処理を一律に共通化する

Window global、legacy platform object、iterator、および interface 固有処理の Web IDL semantics を区別できなくなるため採用しない。

## 参考資料

- [Design log](../design-log/0041-web-idl-realm-binding-boundary.md)
- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0026](./0026-javascript-engine-connection.md)
- [ADR-0027](./0027-window-execution-environment.md)
- [ADR-0028](./0028-window-classic-script-execution.md)
- [ADR-0029](./0029-url-standard-implementation.md)
- [ADR-0031](./0031-document-constructor-boundary.md)
- [ADR-0034](./0034-window-host-execution-entry-point.md)
- [WHATWG Web IDL: ECMAScript binding](https://webidl.spec.whatwg.org/#js-binding)
- [WHATWG Web IDL: Platform objects implementing interfaces](https://webidl.spec.whatwg.org/#dfn-platform-object)
- [WHATWG Web IDL: Legacy platform objects](https://webidl.spec.whatwg.org/#legacy-platform-object)
