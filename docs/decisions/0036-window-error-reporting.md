# ADR-0036: Window environment の処理失敗の観測

## ステータス

accepted

## コンテキスト

host execution entry point は Window environment を生成し、その中で initial document の HTML parsing と JavaScript execution を行う。
この処理では、palim 自身の失敗とは別に、page realm で処理されない JavaScript exception や、HTML parsing を継続できない失敗が発生し得る。

これらを観測するために page 側の Window や DOM object へ palim 固有の機能を追加すると、host と page realm の境界が崩れる。
page 側の `onerror` だけに依存した場合も、page script による置換や取り消しの影響を受ける。

## 決定

- palim 自身が host operation を継続できない失敗は、呼び出し元へ host exception として伝える
- Window environment は生成時から host が所有する暗黙の error handler を持つ
- page realm で処理されない JavaScript exception と、HTML parsing を継続できない失敗は、この handler を通して host へ伝える
- 暗黙の error handler は page 側の `onerror` や event listener と分離し、page script から参照、置換、解除、取り消しできない
- page 側の標準 `onerror` は変更せず、暗黙の error handler の有無を page realm から観測できない
- HTML parser が回復する parse error と、page realm 内で処理された JavaScript exception は、処理を継続できない失敗に含めない

## 影響

- host は initial document の処理中に発生した未処理の JavaScript exception と致命的な parse failure を観測できる
- page 側の Web Platform interface は変更されない
- page realm は暗黙の error handler と engine 固有の実行結果へアクセスできない
- page 側の `onerror` による処理は host の観測を妨げない
- recoverable な parse error と処理済みの JavaScript exception は従来どおり document の処理を停止しない

## 代替案

### page 側の Window に観測用 API を追加する

Web Platform の Window に palim 固有の interface が現れるため採用しない。

### page 側の `onerror` だけを使用する

page script が handler を置換または error event を取り消すことで、host が失敗を観測できなくなるため採用しない。

### 内部の script 実行結果を公開する

標準の例外報告とは別の観測経路を公開するため採用しない。

### Window environment 内の失敗をすべて host exception とする

recoverable な parse error と page realm で処理される exception まで host operation の失敗になるため採用しない。

## 参考資料

- [ADR-0027](./0027-window-execution-environment.md)
- [ADR-0034](./0034-window-host-execution-entry-point.md)
- [WHATWG HTML: Web application APIs](https://html.spec.whatwg.org/multipage/webappapis.html)
- [WHATWG HTML: Parsing HTML documents](https://html.spec.whatwg.org/multipage/parsing.html)
