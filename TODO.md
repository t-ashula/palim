# TODO

## DOM and parsing

### DOM algorithms

- [x] `NodeList` / `HTMLCollection` / `NamedNodeMap` の indexed・named property、own key、strict assignment / delete semantics
- [x] live / static collection の index、length、tree order、および mutation 後の更新
- [x] `DOMTokenList` の iterator callback identity、stringifier、`value`、branding
- [x] `Attr.specified`、prefix / namespace、astral code point を含む name validation
- [x] `Node` / `Element` / `DocumentType` の child access と remove / append / prepend / replace mutation の結果整合性
- [x] `getElementsByTagName` / `getElementsByTagNameNS` / `getElementsByClassName` の HTML・XML case、namespace、class whitespace、liveness
- [x] Selector API の element context、`:scope`、namespace、case sensitivity、form state pseudo-class
- [ ] `DOMImplementation.hasFeature` と `DOMImplementation` interface surface
- [ ] `Node.moveBefore` の range、observer、form state、shadow tree を含む atomic move semantics
- [ ] `TreeWalker` / `NodeIterator` の branding と traversal state

### Parsing and serialization

- [x] document navigation が response MIME type に応じて HTML / XML parser を選ぶ
- [x] `DOMParser` が作る document の URL、origin、content type、scripting flag
- [ ] `DOMParser` の HTML encoding sniffing と `meta charset` に基づく character encoding state
- [ ] `Document.createCDATASection` の document type と `]]>` に対する例外優先順位
- [ ] navigation document の transport / BOM / `meta` に基づく character encoding state
- [ ] HTML tree builder の `style` raw text 終了後に続く sibling を構築する
- [ ] `XMLSerializer` の namespace / prefix 選択、escaping、well-formedness、empty-element serialization
- [ ] `Range.createContextualFragment` の HTML / XHTML context selection と script execution semantics
- [ ] `innerHTML` / `outerHTML` の null変換、style attribute、doctype serialization
- [ ] `Document.parseHTML` と unsafe / positional HTML parsing API
- [ ] streaming HTML parsing API と sanitizer / declarative shadow root integration
- [ ] Trusted Types と parser options を受け取る HTML parsing sink
- [ ] markup insertion と child removal における script preparation、invalid type、実行済み state

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
- [ ] stylesheet と `LinkStyle`
- [ ] image loading と intrinsic size
- [ ] `getComputedStyle` / `getBoundingClientRect` と layout-dependent API
- [ ] CSSOM の `CSS` global と Web Animations の `Element.animate`

### Forms and controls

- [ ] form submission / reset / constraint validation
- [ ] form-associated element の完全な owner 解決
- [ ] input type ごとの value sanitization
- [ ] selection API の type 別制約

### Document surface

- [ ] `document.body` / `head` / `title` / `currentScript`
- [ ] XML document の legacy `rootElement` surface
- [ ] `document.forms` / `images` / `links` / `scripts` / `embeds` / `plugins`
- [ ] `Document` named properties と `id` / `name` mutation、adoption、tree order に追従する collection
- [ ] Window named properties と `id` / `name` mutation に追従する supported property names
- [ ] global attribute reflection、`hidden`、`dir`、`draggable`、`spellcheck`、`translate`
- [ ] `DOMStringMap` の property-name conversion、get / set / delete、supported property names
- [ ] `HTMLDocument` / `XMLDocument` と個別 `HTML*Element` interface constructor の global 公開
- [ ] Selection API の `getSelection()` と DOM mutation / atomic move に対する range 保持

## Events

- [ ] `AbortSignal.abort()` / `any()` / `timeout()`、abort reason、dependent signal propagation
- [ ] capture phase
- [x] `Document.createEvent` と legacy event initialization
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
- [ ] `addEventListener` option dictionary の `capture` / `once` / `passive` / `signal` semantics
- [ ] event listener object の `handleEvent`、callback exception reporting、listener ordering

## Component model

- [ ] Shadow DOM
- [ ] `Element.slot`
- [ ] Custom Elements
- [ ] custom element 用 `[HTMLConstructor]`
- [ ] `ElementInternals`
- [ ] `setHTML` / `setHTMLUnsafe`
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
- [ ] `Document.write`
- [ ] `requestAnimationFrame` / `performance`
- [ ] origin と URL
- [ ] dialog / popover の top layer と event
- [ ] `structuredClone`

### Networking and resource loading

- [ ] resource loading
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
- [ ] `MutationObserver`
- [ ] JavaScript execution と event loop の統合

## Optional JavaScript execution

- [ ] JavaScript realm
- [ ] `<script>` の実行
- [ ] classic script / module script
- [ ] external script loading
- [ ] parser-blocking script
- [x] `document.currentScript`
- [ ] WPT が使用する ECMAScript 構文と engine262 parser の互換性
- [x] `/\${([^ }]*)}/g` を `Invalid decimal digits` とする RegExp literal parse error
- [x] escaped `</script>` を含む template literal を `Invalid template escape` としない

## Conformance infrastructure

- [x] `application/xml` WPT で injected testharness reporter が namespace なしの `a` element に URL reflection を要求しないようにする
- [ ] browser profile で `meta timeout=long` の WPT に long-test 用 timeout budget を適用する
- [ ] DOM shell fixture の element `id` named access、parser timing、script実行順による false failure を分離する
- [ ] DOM shell の `browser-profile-only` / `host-unsupported` static classification を WPT source更新時に監査する
- [ ] DOM shell の fail / error を仕様behavior単位へ集約し、TODOとの対応を機械可読に保持する

## Web IDL bindings

- [ ] `NodeList` の `keys` / `values` / `entries` / `forEach` と iterator identity
- [ ] argument conversion の網羅
- [ ] 例外変換の網羅
- [ ] property descriptor の網羅
- [ ] platform object の `Symbol.toStringTag` と branding
- [ ] interface constructor / prototype / iterable の global 公開 set
- [ ] `Range` / `StaticRange` / `DOMImplementation` / `HTMLDocument` の package runtime export
- [ ] 既存 DOM API の page realm binding 網羅
- [ ] `Node.cloneNode` の page realm binding
- [ ] branding check と `DOMException` name / code の整合

## Standards compliance measurement

- [ ] Selector API の適合度計測方法
- [ ] Selector API 適合度レポート
- [ ] Living Standard 更新時の差分検出
- [ ] commit 済み revision のみで report を更新する運用

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
