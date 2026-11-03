# ADR-0037: Window console への host 介入

## ステータス

accepted

## コンテキスト

Window environment には page realm の `console` がなく、page script の console call を host が処理する境界もない。

page 側へ palim 固有の console API を追加すると Web Platform の interface が変わる。特定の host platform の console へ直接結合すると、Window environment の実行環境が固定される。

## 決定

- page realm には Console Standard に従う `console` を提供する
- Window environment は生成時から console call を受け取る host 側の handler を持つ
- host は console method と引数を受け取り、その処理と出力先へ介入できる
- host 側の handler は page realm へ公開せず、page 側の `console` に palim 固有の property や method を追加しない
- console call は ADR-0036 の error handler と分離し、未処理例外の報告には使用しない
- 特定の host platform や出力形式を Window environment に固定しない

## 影響

- host は initial document の script が行う console call を観測し、処理できる
- page script は標準の `console` だけを使用する
- console output の保存、転送、抑制、および表示は host が決定できる
- console method の引数を page realm と host の間で受け渡す境界が必要になる

## 代替案

### host platform の console を直接使用する

Window environment が特定の platform に依存するため採用しない。

### page 側へ palim 固有の console API を追加する

Web Platform の interface が変わり、page script から host の処理へ介入できるため採用しない。

### console call を未処理例外の報告にも使用する

page script による明示的な console call と実行時の例外報告では意味が異なるため採用しない。

## 参考資料

- [ADR-0027](./0027-window-execution-environment.md)
- [ADR-0036](./0036-window-error-reporting.md)
- [Console Standard](https://console.spec.whatwg.org/)
