# ADR-0051: Window extension と host services による polyfill

## ステータス

accepted

## コンテキスト

DOM と HTML の WPT では、対象機能の準備に palim が実装していない Web API を使用する test がある。
これらの API は DOM の操作には直接関係がないため、palim 自体の機能ではなく、後付で window realm に追加させる仕組みが必要である。

単純に host の function や constructor を Window global に直接設定すると、その値は window realm に属さないため問題がある。
また、一つの global だけでは成立せず、関連する複数のクラスを同じ realm に構築する必要がある API も存在する。

さらに network I/O のように host の機能を必要とする機能に対しては、
page realm の API 実装と host 固有の処理との間で、情報を受け渡していく仕組みが必要である。

## 決定

- `open()` は `extensions` で Window extension を受け取り、extension は各 Window realm に関連 global 群を構築する
- realm 内だけでは完結しない処理は host services が担い、extension は service ごとの中間表現を介して利用する

## 影響

- 複数の関連 global と共有状態を一つの extension として追加できる
- host の object、Promise、Error、および runtime 固有の状態を page script に直接公開しない
- 複数の extension は必要に応じて同じ host service を利用できる

## 代替案

### host の値を Window global に直接設定する

realm ごとの identity と関連 global 間の関係を構築できないため採用しない。

### polyfill が host の処理を個別に保持する

host 機能の契約、設定、および lifecycle が polyfill ごとに異なることになるため採用しない。

### `@palim/core` に各 Web API を実装する

DOM と parser の package に Window global と host I/O の処理が入るため採用しない。

## 参考資料

- [Design log](../design-log/0051-window-polyfill-injection.md)
- [ADR-0046](./0046-multi-package-capability-boundaries.md)
- [ADR-0047](./0047-window-scripting-separation.md)
- [ADR-0049](./0049-page-realm-execution-contract.md)
- [ADR-0050](./0050-page-execution-host-exceptions.md)
