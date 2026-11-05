# TODO

## DOM and parsing

### Page realm bindings

- [x] `Document.importNode` / `adoptNode` と `DocumentFragment.getElementById`
- [x] `Node.replaceChild` / `lookupPrefix` / `lookupNamespaceURI` / legacy node constants
- [x] `Node.isDefaultNamespace`
- [x] `Element.matches` / `closest` / `hasAttributes` / `insertAdjacentElement` / `insertAdjacentText`
- [x] `NamedNodeMap` mutation API と `NodeList` iterable API
- [x] `Range.createContextualFragment`

### DOM algorithms

- [ ] relational pseudo-class `:has()` の `:scope` scoping
- [ ] `DOMImplementation.createDocument` / `createHTMLDocument` / `createDocumentType` の document type、content type、realm、validation
- [ ] hierarchy、not-found、invalid-character、namespace、selector syntax の失敗を仕様上の `DOMException` name / code へ変換する
- [ ] adoption 前後の HTMLness と `nodeName` / `tagName`、`nodeValue` / `textContent` の境界条件
- [ ] 空文字 ID、namespaced ID、XML class token に対する lookup と live collection の境界条件
- [ ] node creation と adoption で作成元 realm を保持する

### Parsing and serialization

- [ ] `DOMParser` が作る document の URL、origin、content type、character encoding、scripting flag
- [ ] `XMLSerializer` の namespace / prefix 選択、escaping、well-formedness、empty-element serialization
- [ ] `Document.parseHTML` と unsafe / positional HTML parsing API
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
- [ ] `document.forms` / `images` / `links` / `scripts` / `embeds` / `plugins`
- [ ] Window named properties と `id` / `name` mutation に追従する supported property names
- [ ] global attribute reflection、`dataset`、`hidden`、`dir`、`draggable`、`spellcheck`、`translate`
- [ ] `HTMLDocument` / `XMLDocument` と個別 `HTML*Element` interface constructor の global 公開
- [ ] Selection API の `getSelection()` と DOM mutation / atomic move に対する range 保持

## Events

- [ ] capture phase
- [ ] `Document.createEvent` と legacy event initialization
- [ ] `Event` subclass constructor と `MouseEvent` / `KeyboardEvent` の realm 公開
- [ ] composed path と shadow boundary
- [ ] event retargeting
- [ ] default action
- [ ] element の `click()` と activation behavior
- [ ] `window.event` / `isTrusted` / high-resolution `timeStamp`
- [ ] UI event / mouse event / pointer event / keyboard event
- [ ] form・media・dialog・popover の仕様イベント
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
- [ ] `document.currentScript`
- [ ] WPT が使用する ECMAScript 構文と engine262 parser の互換性
- [ ] `/\${([^ }]*)}/g` を `Invalid decimal digits` とする RegExp literal parse error
- [ ] escaped `</script>` を含む template literal を `Invalid template escape` としない

## Web IDL bindings

- [ ] argument conversion の網羅
- [ ] 例外変換の網羅
- [ ] property descriptor の網羅
- [ ] interface constructor / prototype / iterable の global 公開 set
- [ ] 既存 DOM API の page realm binding 網羅
- [ ] `Node.cloneNode` の page realm binding
- [ ] branding check と `DOMException` name / code の整合

## Standards compliance measurement

- [ ] Selector API の適合度計測方法
- [ ] Selector API 適合度レポート
- [ ] HTML element interface 適合度レポート
- [ ] WPT から palim 単体で実行可能なケースの整理
- [ ] Living Standard 更新時の差分検出
- [ ] commit 済み revision のみで report を更新する運用

## Performance and memory

- [ ] jsdom / parse5 との同一 workload 比較
- [ ] capability を揃えた比較条件
- [ ] 大規模 HTML corpus
- [ ] fragment parsing benchmark
- [ ] selector benchmark
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
