# ADR-0029: URL Standard の実装境界と適合テスト

## ステータス

accepted

## コンテキスト

ADR-0028 の初期実装は `node:url` の `URL` object を `Document`、Window environment settings、および classic script の内部状態へ直接持ち込んだ。
この構成では host object の型と可変性が palim の内部境界へ漏れ、parser-only の import graph と build 設定も Node.js 固有 API に依存する。

既存の hyperlink member も `globalThis.URL` を使用している。
host の URL 実装に処理を委ねると、palim 自身の適合結果を独立して確認できない。

## 決定

- URL Standard の実装に `node:url`、`globalThis.URL`、または別の host native URL object を使用しない
- URL 実装を差し替える設定を設けず、実装固有の object を consumer へ公開しない
- WHATWG および WPT が提供・指定する URL test suite を適合テストに使用する
- ADR-0028 で `Window` などの導入した URL と origin、および既存の hyperlink member を内製の URL 実装へ移行する

## 影響

- parser-only と Window の内部状態から host native URL object を除去できる
- URL を利用する既存機能の移行が必要になる
- URL Standard と WPT の更新に合わせて実装と適合結果を保守する必要がある

## 代替案

### `node:url` の `URL` を使用する

Node.js 固有型と build 設定への依存が URL の consumer へ広がり、palim 自身の適合結果を確認できないため採用しない。

### `globalThis.URL` を使用する

実行 host によって実装と利用可能性が変わり、palim が構築する realm と host realm も混同するため採用しない。

### URL 実装 package の object を consumer へ公開する

package 固有の型と更新が consumer へ波及するため採用しない。

## 参考資料

- [Design log](../design-log/0029-url-standard-implementation.md)
- [ADR-0002](./0002-compliance-measurement.md)
- [ADR-0028](./0028-window-classic-script-execution.md)
- [WHATWG URL Standard](https://url.spec.whatwg.org/)
- [WHATWG URL repository](https://github.com/whatwg/url)
- [WPT URL tests](https://github.com/web-platform-tests/wpt/tree/master/url)
