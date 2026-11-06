# ADR-0044: WPT DOM shell profile の廃止

## ステータス

accepted

## コンテキスト

WPT DOM shell profile は browser environment の不足から DOM operation の結果を分離する目的で導入した。
しかし、runner が test に公開する環境は package の実行時 export から構成されており、page realm が公開する interface と同じではなかった。

この差により、同じ WPT source が browser profile では成功し、DOM shell profile では公開 interface の不足によって失敗する状態が生じた。
DOM shell profile の成功と失敗は page realm における palim の仕様適合度を示さず、その結果から実装課題や完了条件を導くこともできない。

## 決定

WPT DOM shell profile を廃止し、runner、project test、実行 script、生成物、説明文書、および計測結果を削除する。
DOM と HTML の仕様適合性は page realm を使用する WPT browser profile で確認し、project test は実装の回帰検出に使用する。
browser environment の未実装機能によって WPT を実行できない場合は、その不足を検証結果から分離して記録する。

## 影響

- package interface を WPT の global object として扱う検証経路がなくなる
- DOM shell profile の既存レポートを TODO の追加、優先順位、または完了判定に使用しない
- browser profile で実行不能な DOM test を適合性の数値へ含めるには、page realm の実行条件を整える必要がある
- project test 単独では外部 test suite による仕様適合性を保証しない

## 代替案

### DOM shell profile の公開 interface を個別に補う

page realm とは別の公開環境を維持し続けることになり、その環境で WPT が成功しても page realm の挙動を保証しないため採用しない。

### package interface と page realm の一致を前提に継続する

両者は異なる利用境界を持ち、現時点でも公開される interface と binding の挙動が一致しないため採用しない。

## 参考資料

- [ADR-0002](./0002-compliance-measurement.md)
- [ADR-0025](./0025-dom-interface-binding-implementation.md)
- [ADR-0033](./0033-wptrunner-product-integration.md)
- [ADR-0041](./0041-web-idl-realm-binding-boundary.md)
