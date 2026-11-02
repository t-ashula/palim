# ADR-0032 Design log: parser-inserted external classic script の resource loading 境界

## 記録範囲

script fetching、decoding、preparation、および実行順序として HTML Standard が定める処理は転記しない。
palim の parser、script execution layer、host loader の境界と、初期実装で持たない責務だけを記録する。

## Resource loader

- `WindowExecutionEnvironment` の生成時に loader を受け取る
- loader は host capability として script execution layer が呼び出し、Window realm、global object、および standard 由来 interface へ公開しない
- loader は解決済み URL を入力とし、response body の bytes、最終 URL、および decoding に必要な response metadata を返す
- loader の失敗は値として返し、HTML parser や classic script runtime へ host exception を通過させない
- loader は Window、`Document`、HTML element、engine value、および compiled script を受け取らない
- loader の結果は Window environment を越えて共有しない

初期実装では HTTP client、cache、cookie、service worker、および CSP や CORS などの policy layer を設けない。
project test と WPT resource は、同じ loader 境界へ deterministic な local resource として接続する。
ページ側の realm で実行するのは loader が返した external script の内容だけとする。

## Parser との接続

- parser-inserted script の callback は script execution layer が実装する
- external parser-blocking script を処理するときは callback の非同期完了まで token processing を進めない
- loading と script execution の完了後は、停止時と同じ tokenizer、tree builder、stack、および active `Document` で処理を続ける
- parser の同期処理と非同期処理に別の tree construction implementation を持たない
- parser-only の `DOMParser` と既存の parsing entry point は resource loader を参照せず、同期 API を維持する

Window execution environment の非同期 HTML parsing は `Promise<Document>` を返す。
この Promise は parser が EOF に達し、parser-blocking script と parser state の終了処理が完了した時点で解決する。
document lifecycle event の dispatch 完了は表さない。

## Script execution との接続

- script の URL は active `Document` の API base URL を基準に解決する
- loader が返した bytes を script execution layer で source text に変換する
- classic script の source URL には loader が返す最終 URL を使用する
- source text は ADR-0028 の classic script 作成・実行経路へ渡し、engine adapter を直接呼ばない
- inline script と external script の結果を一つの処理順で記録する

loading または decoding が失敗した場合は classic script を作成せず、その script の失敗を記録して parse を継続する。
classic script の parse error と runtime exception は ADR-0028 および ADR-0030 の error 境界を維持する。

## 初期対象

- parser-inserted external classic script のうち parser-blocking として処理するものだけを接続する
- `async`、`defer`、module script、import map、および dynamically inserted script は接続しない
- `document.write()` による parser の再入は接続しない
- document readiness、`DOMContentLoaded`、`load`、およびそれらを処理する task queue は接続しない
- WPT runner と testharness report の統合は本 ADR に含めない

## Project test

project test は local resource loader を使用し、palim 固有の接続を確認する。

- relative `src` が active `Document` の URL を基準に loader へ渡される
- external script の取得中は parser が後続 markup を処理しない
- external script、inline script、および後続 markup の順序が維持される
- external script から行った DOM mutation を host 側から観測できる
- loading、decoding、syntax、および runtime の各失敗後も parse と後続 script が継続する
- 異なる Window environment の resource、realm、global state、および DOM state が共有されない
- parser-only の import graph に loader、runtime、および engine backend が含まれない

binding の内側で実行する JavaScript test source は JavaScript file に分離する。

## 完了条件

- host loader から供給した parser-inserted external classic script が ADR-0028 の runtime で実行される
- resource loading と script execution の間、parser の状態と active `Document` が維持される
- inline script と external script の実行順序および global state が維持される
- loader、parser、classic script runtime、および engine adapter の責務が分離される
- loading と script の失敗を host exception に変換せず、parse と後続 script が継続する
- parser-only の同期 API と import boundary が維持される
- WPT の外部 JavaScript resource を local loader から供給して実行できる
- project の format、lint、typecheck、test、および build が成功する

## 参考資料

- [ADR-0032](../decisions/0032-parser-inserted-external-classic-script.md)
- [ADR-0028 Design log](./0028-window-classic-script-execution.md)
- [ADR-0030 Design log](./0030-script-element-classic-script-execution.md)
- [WHATWG HTML: The script element](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element)
- [WHATWG HTML: Fetching scripts](https://html.spec.whatwg.org/multipage/webappapis.html#fetch-a-classic-script)
