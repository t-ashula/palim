# TODO

## DOM and parsing

### Parsing and serialization

- [ ] Trusted Types と parser options を受け取る HTML parsing sink
- [ ] `Sanitizer` configuration の validation、normalization、modifier、safe baseline
- [ ] safe / unsafe HTML parsing sink の custom element reaction、form owner、declarative Shadow DOM
- [ ] streaming HTML setter の chunk insertion、script scheduling、custom element reaction
- [ ] markup insertion と child removal における script preparation、invalid type、実行済み state
- [ ] `Document.write()` / `writeln()` の複数呼び出しで tokenizer state と input preprocessing を chunk 境界越しに維持する
- [ ] parser-inserted script 内の `Document.write()` を active insertion point に再入し、後続 input より先に処理する
- [ ] active formatting elements に開始タグ token を保持し、reconstruction / adoption agency で live DOM mutation 前の属性から要素を生成する
- [ ] parser script が document tree を除去・再接続した場合の tree builder state と insertion location の更新
- [ ] HTML tree builder の adoption agency、foster parenting、form element pointer、foreign content integration
- [ ] HTML tree builder の template insertion mode と stack clear algorithm

## HTML element behavior

### User interaction and editing

- [ ] focus management
- [ ] editing API と `contenteditable`
- [ ] `innerText` / `outerText`

### Loading, rendering, and embedded content

- [ ] media loading・再生状態・track
- [ ] canvas rendering context
- [ ] iframe の post-connection / removing steps、`load` event ordering、atomic move 時の child document 維持
- [ ] iframe navigation で response MIME type を保持し、`data:` URL の body と fragment を分離して HTML / XML / text / image document を生成する
- [ ] frame/object/embed の browsing context
- [ ] CSS cascade（origin・specificity・source order・`!important`）、inheritance、initial / computed value の基盤
- [ ] stylesheet と `LinkStyle`
- [ ] image loading と intrinsic size
- [ ] `getComputedStyle` / `getBoundingClientRect` と layout-dependent API
- [ ] CSSOM の `CSS` global と Web Animations の `Element.animate`

### Forms and controls

- [ ] `HTMLSelectElement` / `HTMLOptionsCollection` の options、selectedOptions、indexed / named property surface
- [ ] `FormData` の form / submitter による entry list 構築、successful controls、改行の正規化
- [ ] form submission / reset / constraint validation
- [ ] form-associated element の完全な owner 解決
- [ ] input type ごとの value sanitization
- [ ] selection API の type 別制約

### Document surface

- [ ] Selection API の `Selection` object、Document / Window の `getSelection()`、コードによる range の関連付けと保持
- [ ] pointer 操作を含むユーザー操作による Selection の生成と DOM mutation / atomic move 時の選択補正

## Events

- [ ] `AbortSignal.abort()` / `any()` / `timeout()`、abort reason、dependent signal propagation
- [ ] capture phase
- [ ] `Event` / `CustomEvent` constructor と legacy initializer の required argument conversion
- [ ] `Event` / `Node` の legacy constants と interface / instance property placement
- [ ] `Event` subclass constructor、legacy factory alias と `MouseEvent` / `KeyboardEvent` の realm 公開
- [ ] composed path と shadow boundary
- [ ] event retargeting
- [ ] `cancelBubble` / propagation flag / event phase の dispatch 前後と redispatch時の状態
- [ ] default action
- [ ] element の `click()` と activation behavior
- [ ] `window.event` / `isTrusted` / high-resolution `timeStamp`
- [ ] UI event / mouse event / pointer event / keyboard event
- [ ] form・media・dialog・popover の仕様イベント
- [ ] `Window` / `Body` / `FrameSet` event handler IDL attribute と初期値
- [ ] `addEventListener` option dictionary の `capture` / `once` / `passive` / `signal` semantics
- [ ] event listener object の `handleEvent`、callback exception reporting、listener ordering

## Component model

- [ ] shadow root の attach 条件、mode、host、clonable / serializable state
- [ ] slot assignment、manual slotting、`Element.slot`、`HTMLSlotElement.assign()`、`slotchange`
- [ ] `CustomElementRegistry` の construction、definition lookup、`whenDefined()`、upgrade、scoped registry
- [ ] custom element の construction、upgrade、parser integration、customized built-in element 用 `[HTMLConstructor]`
- [ ] custom element reaction queue と connected / disconnected / adopted / attributeChanged callback
- [ ] `ElementInternals` と form-associated custom element
- [ ] shadow root を含む serialization と `getHTML()`

## Window and platform services

### Window and browsing context

- [ ] host 側の `onerror` を initial document の実行前に設定し、過去の error を再送しない
- [ ] page execution error を蓄積し、全件取得できる API を `onerror` と分けて提供する
- [ ] `Document.defaultView`
- [ ] `Location`
- [ ] `History`
- [ ] `Navigator`
- [ ] browsing context
- [ ] XHTML/XML navigation と `readyState` / `readystatechange` / `stop()`
- [ ] `requestAnimationFrame` / `performance`
- [ ] dialog / popover の top layer と event
- [ ] `structuredClone`

### Networking and resource loading

- [ ] resource loading
- [ ] `Blob` / `File` / `FileList` の page realm 公開と `FormData` の binary entry
- [ ] Blob URL store、`URL.createObjectURL()` / `revokeObjectURL()`、`blob:` resource loading
- [ ] Web Streams の underlying source / sink、queue、backpressure、close / abort / error、reader / writer lock semantics
- [ ] Encoding API の page realm 公開と `Response.body` の stream 接続
- [ ] Fetch の redirect / network error / abort、credentials・referrer・mode、streaming response
- [ ] `Request` / `Response` の `formData()`、URL-encoded / multipart body、Blob・FormData・ArrayBuffer body conversion
- [ ] `XMLHttpRequest`

### Storage and state

- [ ] cookie
- [ ] storage

### Workers

- [ ] `Worker` / `SharedWorker` の execution realm

## Runtime scheduling

- [ ] timers
- [ ] task queue / microtask queue
- [ ] event dispatch と microtask の連携
- [ ] `MutationObserver` の childList / attributes / characterData record、oldValue / filter option、option validation、callback exception reporting
- [ ] JavaScript execution と event loop の統合

## Optional JavaScript execution

- [ ] JavaScript realm
- [ ] `<script>` の実行
- [ ] classic script / module script
- [ ] external script loading
- [ ] parser-blocking script
- [ ] WPT が使用する ECMAScript 構文と engine262 parser の互換性
- [ ] browser page realm の Annex B built-in（少なくとも `String.prototype.substr`）

## Conformance infrastructure

- [ ] browser profile で `meta timeout=long` の WPT に long-test 用 timeout budget を適用する
- [ ] 同一 revision / image で full WPT campaign の jobs 10と20を比較し、timeoutを増やさない並列数と資源条件を決める
- [ ] WPT test 並列実行時の timeout の影響を、安定した jobs 設定と終了後の直列再実行で軽減する

## Web IDL bindings

- [ ] argument conversion の網羅
- [ ] 例外変換の網羅
- [ ] property descriptor の網羅
- [ ] platform object の `Symbol.toStringTag` と branding
- [ ] interface constructor / prototype / iterable の global 公開 set
- [ ] `Range` / `StaticRange` / `DOMImplementation` / `HTMLDocument` の package runtime export
- [ ] 既存 DOM API の page realm binding 網羅

## Standards compliance measurement

- [ ] Selector API の適合度計測方法
- [ ] Selector API 適合度レポート
- [ ] Living Standard 更新時の差分検出
- [ ] WPT report 更新前後の URL / subtest status 差分と regression の自動検出

## Performance and memory

- [ ] jsdom / parse5 との同一 workload 比較
- [ ] capability を揃えた比較条件
- [ ] 大規模 HTML corpus
- [ ] fragment parsing benchmark
- [ ] selector benchmark
- [ ] `ParentNode-querySelector-All.html` を browser profile の timeout 内で完走させる selector matching 性能
- [ ] DOM mutation benchmark
- [ ] serialization benchmark
- [ ] 多数 document の生成・破棄 workload
- [ ] regression threshold
- [ ] CI での継続計測

## X. Incremental capability architecture

- [ ] parser、DOM、Window、JavaScript execution の依存方向を分離
- [ ] monorepo package 分離
- [ ] parser 利用時に Window 関連コードを読み込まない構成
- [ ] capability 単位の package export
- [ ] optional layer ごとの性能・メモリ計測
- [ ] 対応能力を機械可読な metadata として公開
- [ ] JavaScript execution を無効化した軽量構成の維持
