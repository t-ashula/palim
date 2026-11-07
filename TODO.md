# TODO

## DOM and parsing

### DOM algorithms

- [ ] Selector API の CSS identifier / escape syntax validation と `SyntaxError`
- [ ] `Range` の boundary validation、比較、clone / extract / delete / insert / surround と mutation 後の live range 更新

### Parsing and serialization

- [ ] `XMLSerializer` の namespace prefix reuse / rebinding
- [ ] streaming HTML parser の reentrant write / abort ordering
- [ ] Trusted Types と parser options を受け取る HTML parsing sink
- [ ] markup insertion と child removal における script preparation、invalid type、実行済み state
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
- [ ] iframe/object/embed の browsing context
- [ ] iframe の独立 realm と cross-realm DOM object binding
- [ ] CSS cascade（origin・specificity・source order・`!important`）、inheritance、initial / computed value の基盤
- [ ] stylesheet と `LinkStyle`
- [ ] image loading と intrinsic size
- [ ] `getComputedStyle` / `getBoundingClientRect` と layout-dependent API
- [ ] CSSOM の `CSS` global と Web Animations の `Element.animate`

### Forms and controls

- [ ] `HTMLSelectElement` / `HTMLOptionsCollection` の options、selectedOptions、indexed / named property surface
- [ ] `FormData` の form / submitter による entry list 構築と Blob / File entry
- [ ] form submission / reset / constraint validation
- [ ] form-associated element の完全な owner 解決
- [ ] input type ごとの value sanitization
- [ ] selection API の type 別制約

### Document surface

- [ ] `document.body` / `head` / `title`
- [ ] XML document の legacy `rootElement` surface
- [ ] `document.forms` / `images` / `links` / `scripts` / `embeds` / `plugins`
- [ ] `Document` named properties と `id` / `name` mutation、adoption、tree order に追従する collection
- [ ] Window named properties と `id` / `name` mutation に追従する supported property names
- [ ] global attribute reflection、`hidden`、`dir`、`draggable`、`spellcheck`、`translate`
- [ ] `DOMStringMap` の property-name conversion、get / set / delete、supported property names
- [ ] `HTMLDocument` interface constructor と HTML document の prototype relationship
- [ ] Selection API の `getSelection()` と DOM mutation / atomic move に対する range 保持

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

- [ ] Shadow DOM
- [ ] `Element.slot`
- [ ] Custom Elements
- [ ] custom element 用 `[HTMLConstructor]`
- [ ] `ElementInternals`
- [ ] shadow root を含む serialization

## Window and platform services

### Window and browsing context

- [ ] `Window`
- [ ] host 側の `onerror` を initial document の実行前に設定し、過去の error を再送しない
- [ ] page execution error を蓄積し、全件取得できる API を `onerror` と分けて提供する
- [ ] `Document.defaultView`
- [ ] `Location`
- [ ] `History`
- [ ] `Navigator`
- [ ] browsing context
- [ ] XHTML/XML navigation と `readyState` / `readystatechange` / `stop()`
- [ ] `Document.open` / `write` / `writeln` / `close`
- [ ] `requestAnimationFrame` / `performance`
- [ ] origin と URL
- [ ] dialog / popover の top layer と event
- [ ] `structuredClone`

### Networking and resource loading

- [ ] resource loading
- [ ] Web Streams と Encoding API の page realm 公開、および `Response.body` の pipe 接続
- [ ] `fetch`
- [ ] `Request` と fetch 関連 global の realm 公開
- [ ] `XMLHttpRequest`

### Storage and state

- [ ] cookie
- [ ] storage

### Workers

- [ ] Dedicated Worker (`Worker`)

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

## Conformance infrastructure

- [ ] browser profile で `meta timeout=long` の WPT に long-test 用 timeout budget を適用する
- [ ] DOM shell fixture の element `id` named access、parser timing、script実行順による false failure を分離する
- [ ] DOM shell の `browser-profile-only` / `host-unsupported` static classification を WPT source更新時に監査する
- [ ] DOM shell の fail / error を仕様behavior単位へ集約し、TODOとの対応を機械可読に保持する

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
