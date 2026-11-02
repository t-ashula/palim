# ADR-0030 Design log: parser-inserted script element と classic script の接続

## 記録範囲

HTML Standard が規定する script preparation、実行順序、および element の状態はこの文書に転記しない。palim 固有の接続、初期実装で扱わない構成、および完了条件だけを記録する。

## 接続境界

- script execution entry point が Window、active `Document`、HTML parser、および ADR-0028 の runtime を組み立てる
- HTML parser は JavaScript engine、engine value、および compiled script handle を参照しない
- parser-inserted script の処理時点を callback 境界として script execution layer へ通知する
- script execution layer は source text と document URL から classic script を作成し、同じ Window environment の runtime で実行する
- callback は script の実行が終わるまで parser を進めない

Window の active `Document` と `defaultView` は、最初の script callback より前に接続済みでなければならない。

## 初期対象

初期実装では parser-inserted inline classic script だけを接続する。

- `src` を持つ script は取得しない
- dynamically inserted script は実行しない
- `async`、`defer`、module script、および import map は扱わない
- `document.write()` による parser の再入は扱わない
- script の type 判定と実行可否は独自規則を設けず HTML Standard に従う

external script を inline source へ置き換える test 専用処理は設けない。external script と WPT testharness の読み込みは resource loading の接続後に扱う。

## Error の境界

- classic script の parse error と runtime exception は ADR-0028 の engine result のまま script processing layer へ返す
- error を host exception として parse の呼び出し元へ throw しない
- 一つの script が失敗しても parser と後続の parser-inserted script の処理を継続する
- error event、message と stack の整形、および console reporting は追加しない

## Project test

project test は palim 固有の接続だけを確認する。

- 同じ HTML source の複数 script が一つの Window realm と global state を共有する
- script から同じ active `Document` を参照し、DOM mutation を host 側から観測できる
- script 実行時点より前の markup は参照でき、後の markup はまだ存在しない
- syntax error または runtime exception があっても parse と後続 script が継続する
- parser-only の import graph は engine package を読み込まない

binding の内側で実行する JavaScript test source は TypeScript の文字列へ埋め込まず、JavaScript file として分離する。

## 完了条件

- Window execution environment へ HTML source を渡すと parser-inserted inline classic script が ADR-0028 の runtime で実行される
- script は対応する Window realm、Window environment settings、および active `Document` を使用する
- 複数 script の global state、DOM state、および実行順序が維持される
- script の失敗を host exception へ変換せず、parse と後続 script が継続する
- parser-only の import graph は JavaScript engine の import boundary を維持する
- project の format、lint、typecheck、test、および build が成功する

## 参考資料

- [ADR-0030](../decisions/0030-script-element-classic-script-execution.md)
- [ADR-0026 Design log](./0026-javascript-engine-connection.md)
- [ADR-0028 Design log](./0028-window-classic-script-execution.md)
- [WHATWG HTML: Script processing model](https://html.spec.whatwg.org/multipage/scripting.html#script-processing-model)
- [WHATWG HTML: The script element](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element)
