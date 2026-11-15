# ADR-0057: package 間 API と export/import の管理

## ステータス

accepted

## コンテキスト

ADR-0046 は、機能ごとに package を分離し、上位 package が下位 package の非公開操作を必要とする場合は専用 subpath を `exports` に列挙する方針を定めた。

現在の capability package は `./internal/*.js` を wildcard で公開している。
別の package はこの subpath を使い、DOM implementation、parser、Window、realm binding などの実装 module をファイル単位で直接 import している。
`palim` と `@palim/window` も `@palim/core` の internal subpath から値を再 export している。

この構成では、各 package が提供する API が明示されず、実装 module の分割、統合、または置換が参照元 package の変更を伴う。
また、同じ package の root、internal subpath、および実装 module に複数の import path が存在し、どの path を使用するかが参照元ごとに異なっている。
package 分離によって依存方向と所有する機能を管理するには、各 package が提供する entry point を一つに限定する必要がある。

## 決定

### export

- 各 package は root entry point だけを公開し、subpath export を設けない
- 各 package は自身が提供する機能を root entry point から明示的に export する
- root entry point は export する項目を個別に管理し、実装 module の内容を wildcard で再 export しない
- ADR-0046 が定めた専用 internal subpath は使用しない

### import の規則

- 別の package からは、依存先 package の root entry point だけを import する
- 別の package の subpath、source path、および配布 artifact 内の file path を import しない
- 同じ package 内の実装 module は相対 path で import し、自 package の root entry point を経由しない
- 別の package の export を利用する package は、提供側 package を自身の dependency として宣言する

### 再 export

- `palim` は、full package の利用者向け API として提供すると決めた値と型だけを再 export する
- capability package は、依存先 package の root export を一括再 export しない

### 継続的な管理

- root export は、その package が提供する機能の追加または変更として管理する
- 利用側の都合だけで、提供側 package の実装を root entry point に追加しない
- root export だけで機能を構成できない場合は、実装 module を公開せず、機能を所有する package と依存方向を見直す
- build と test は配布 artifact の root entry point を通した参照を検証し、subpath と file path への参照を許可しない

## 影響

- package ごとに、root から利用できる API と非公開実装が区別される
- 実装 module の分割、統合、および配置変更を参照元 package から独立して行いやすくなる
- package 間の依存は、提供側の root export と各 package の dependency に現れる
- 現在の `./internal/*.js` export と、それを使用する import および再 export は整理が必要になる
- 各 package は root export の変更を互換性管理の対象として扱う必要がある
- 利用側の都合で提供側の実装を公開できないため、機能を所有する package または依存方向の再検討が必要になる場合がある

## 代替案

### subpath に package 間 API を公開する

一つの package に複数の import path が生まれ、利用側が root と subpath を使い分ける必要があるため採用しない。

### `./internal/*.js` の wildcard export を維持する

実装 module が追加されるたびに別 package から参照可能になり、実装ファイルの構成が package 外の import path になるため採用しない。

### source path または配布 artifact の file path を参照する

package の `exports` を経由せず、実装 module の配置変更が別 package の変更を伴うため採用しない。

## 参考資料

- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0031](./0031-document-constructor-boundary.md)
- [ADR-0046](./0046-multi-package-capability-boundaries.md)
- [ADR-0047](./0047-window-scripting-separation.md)
