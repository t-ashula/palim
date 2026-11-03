# ADR-0035: WPT document の resource loading

## ステータス

accepted

## コンテキスト

ADR-0033 により、Node runner は wptrunner から渡された test URL を `open(url)` へ渡す。
WPT の test document は WPT server が提供する resource を参照するが、現在の接続では実際の WPT 実行時に initial document 以外の取得を確認できていない。

WPT resource を palim 側へ複製または注入すると、WPT server が構成した document を実行するという境界が失われる。

## 決定

- `open(url)` は initial document が参照する resource を browser environment の resource loading として取得する
- resource の URL は取得後の document URL と document base URL を使用して解決する
- WPT server が返す resource を変更せず使用する
- Node runner は test URL を `open(url)` へ渡す以外の resource 処理を行わない
- WPT resource の取得を実際の wptrunner 実行で確認する

## 影響

- WPT server が構成した test document と resource がそのまま palim の実行対象になる
- palim repository に WPT resource の代替物を追加しない
- document readiness や test 完了通知は resource 取得後の別の境界として扱う

## 代替案

### WPT resource を palim 側から供給する

WPT server の resource と異なる内容を実行し得るため採用しない。

### Node runner が resource を個別に取得する

browser environment と異なる loading 経路を作るため採用しない。

## 参考資料

- [ADR-0032](./0032-parser-inserted-external-classic-script.md)
- [ADR-0033](./0033-wptrunner-product-integration.md)
- [ADR-0034](./0034-window-host-execution-entry-point.md)
- [WHATWG HTML: Fetching resources](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#fetching-resources)
