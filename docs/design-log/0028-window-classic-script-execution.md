# ADR-0028 Design log: Window environment settings と classic script の実行境界

## 初期構成

script execution を接続した一つの Window 環境は、次の状態を共有する。

| 状態 | 責務 |
| --- | --- |
| Window environment settings | realm、URL、origin、および current settings の基準 |
| classic script runtime | script の作成、実行前後の状態管理、および checkpoint |
| classic script | source、settings、base URL、compiled script または parse error |
| engine adapter | source の compile、compiled script の実行、および Promise job の処理 |

Window realm binding と environment settings は一対一に対応させる。
同じ Window 環境で作成した classic script は同じ realm と global state を使用する。

## URL と origin

最初の実装では、Window 環境の生成時に absolute URL を一つ受け取り、指定がない場合は `about:blank` とする。

- creation URL は Window 環境の生成時に固定する
- top-level creation URL は top-level Window では creation URL と同じ値にする
- API base URL は active `Document` の URL を返す
- HTTP(S) URL の origin は scheme、host、および port の tuple として保持する
- origin を tuple として表せない URL には一つの Window 環境だけに属する opaque origin を割り当てる
- navigation と origin inheritance は初期実装に含めない

URL と origin の内部表現は engine value にせず、Window 環境の状態として保持する。
この段階では `Location`、`document.URL`、`document.baseURI` などの公開 member を追加しない。

## Classic script の作成

classic script の作成は、source text、Window environment settings、および任意の source URL を入力とする。
source URL が指定されない場合は settings object の API base URL を使用する。

engine adapter は source の compile と実行を分離し、compile 結果を opaque compiled-script handle として返す。
compile が失敗した場合は最初の parse error を engine value として classic script に保持し、script の作成自体は成功させる。

初期実装では次を固定する。

- muted errors は false
- fetch options は保持しない
- scripting は有効
- source text の取得と decoding は呼び出し側で完了している

## Classic script の実行

classic script の実行は次の順序にする。

1. script の settings object が属する Window と active `Document` を確認する
2. runtime の current settings stack へ settings object を積み、実行深度を一つ増やす
3. parse error がある場合はその engine value を throw result とする
4. parse 済みの場合は compiled script を engine adapter で実行する
5. `finally` 相当の処理で実行深度を戻し、current settings stack から settings object を取り除く
6. 実行深度が 0 になった場合だけ Promise job checkpoint を実行する
7. normal または throw の engine result を呼び出し側へ返す

同じ runtime への再入を許可する。
内側の実行終了時には checkpoint を実行せず、最外の実行終了時に一度だけ実行する。
checkpoint 中に script が再入した場合も、settings stack と実行深度を同じ規則で管理する。

## Error の境界

classic script runtime は parse error と runtime exception を区別する。
いずれも engine value として保持し、この層では host の `Error` へ変換しない。

初期 API の呼び出し側は結果の種別と engine value を取得できる。
error event の dispatch、message と stack の整形、muted errors、および console への reporting は後続の error reporting 境界で扱う。

## Import graph

- parser-only entry point は Window、classic script runtime、および engine backend を読み込まない
- Window entry point は classic script runtime と engine backend を読み込まない
- script execution entry point が Window、runtime、engine adapter implementation を組み立てる
- engine 固有 package は script execution entry point を使用した場合だけ読み込む

## 完了条件

- 同じ Window execution environment で複数の classic script を実行したときに global state と DOM state が維持される
- 異なる Window execution environment の settings、realm、global state、および DOM state が共有されない
- creation URL、top-level creation URL、API base URL、および origin を settings object から取得できる
- syntax error を含む source は評価されず、parse error の engine value を返す
- runtime exception は throw result として返り、host の例外へ暗黙に変換されない
- classic script から行った DOM mutation を host 側の公開 interface で観測できる
- script 実行中だけ対応する settings object が current settings となり、normal completion と abrupt completion の両方で以前の状態へ戻る
- script 実行が再入しても内側の終了時には Promise job が実行されず、最外の終了時に一度だけ checkpoint が発生する
- Promise callback から同じ Window と DOM platform object を参照できる
- parser-only と script execution を接続しない Window の test は runtime と engine package を読み込まずに実行できる

## 参考資料

- [ADR-0028](../decisions/0028-window-classic-script-execution.md)
- [ADR-0026 Design log](./0026-javascript-engine-connection.md)
- [ADR-0027 Design log](./0027-window-execution-environment.md)
- [WHATWG HTML: Environment settings objects](https://html.spec.whatwg.org/multipage/webappapis.html#environment-settings-objects)
- [WHATWG HTML: Creating a classic script](https://html.spec.whatwg.org/multipage/webappapis.html#creating-a-classic-script)
- [WHATWG HTML: Running a classic script](https://html.spec.whatwg.org/multipage/webappapis.html#run-a-classic-script)
- [WHATWG HTML: Script settings for `Window` objects](https://html.spec.whatwg.org/multipage/nav-history-apis.html#script-settings-for-window-objects)
