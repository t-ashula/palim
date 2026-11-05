# TODO

## 1. Parsing and serialization

- [x] fragment parsing
- [x] `innerHTML` など、context element を使用する parse
- [x] parser error の公開方法
- [x] byte input と encoding detection
- [x] HTML serialization
- [x] XML/XHTML/SVG parsing
- [x] `DOMParser` の HTML 以外の MIME type

## 2. Core DOM

### Node creation and ownership

- [x] `Document.createElement` / `createElementNS`
- [x] `createTextNode` / `createComment` / `createDocumentFragment`
- [x] `cloneNode` / `importNode` / `adoptNode`
- [x] page realmの`Text` / `Comment` constructorでdata引数を変換する

### Node content mutation

- [x] `Node.normalize`
- [x] `CharacterData` の `appendData` / `deleteData` / `insertData` / `replaceData` / `substringData`
- [x] `ChildNode` / `ParentNode` の `before` / `after` / `replaceWith` / `remove` / `prepend` / `append` / `replaceChildren`
- [x] `Node.moveBefore` と atomic move
- [x] insertion / post-connection stepsで動的inline classic scriptを実行する
- [ ] 残りのinsertion steps / removing steps / post-connection steps

### Node relationships and comparison

- [x] `getRootNode`
- [x] `contains`
- [x] `compareDocumentPosition`
- [x] `isEqualNode` / `isSameNode`

### Attributes and collections

- [x] `Element.classList`
- [x] `Element.id` / `className`
- [x] `NamedNodeMap` の取得・設定・削除 API
- [x] `getAttributeNodeNS` と namespace attribute mutation
- [x] `Document.createAttribute` と非namespace attribute APIのpage realm binding
- [ ] `NamedNodeMap` supported property namesの重複排除とHTML case filtering
- [ ] `DOMTokenList` の realm binding と `contains` を含む既存 API の公開

### Lookup

- [x] `getElementsByTagName` / `getElementsByTagNameNS` / `getElementsByClassName`
- [x] `Document` / `DocumentFragment.getElementById`
- [ ] `Document.getElementsByName`
- [ ] `DocumentFragment` の selector API binding

### Traversal and ranges

- [x] `NodeIterator` / `TreeWalker`
- [x] `Range`
- [ ] `Document.createRange` と page realm の `Range` / `StaticRange` constructor 公開
- [ ] `CharacterData` と tree mutation に対する live range 更新の網羅
- [ ] Range の extract / delete / clone / insert / surround / point 比較の WPT 境界条件

## 3. Dynamic markup and serialization APIs

- [x] `innerHTML`
- [x] `outerHTML`
- [x] `insertAdjacentHTML`
- [x] `XMLSerializer`

## 4. Selectors

- [x] Selectors Level 4 の未対応構文
- [x] namespace selector
- [x] pseudo-class の構文と DOM tree / static state による matching
- [x] `:scope` の全 context
- [x] forgiving selector list
- [x] selector syntax の仕様テスト

## 5. HTML element behavior

### Structured elements

- [x] table mutation algorithm の全境界条件

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

## 6. Events

- [ ] capture phase
- [ ] `Document.createEvent` と legacy event initialization
- [ ] `Event` subclass constructor と `MouseEvent` / `KeyboardEvent` の realm 公開
- [x] listener option の `passive`
- [x] listener option の `signal`
- [ ] composed path と shadow boundary
- [ ] event retargeting
- [ ] default action
- [ ] element の `click()` と activation behavior
- [ ] `window.event` / `isTrusted` / high-resolution `timeStamp`
- [ ] UI event / mouse event / pointer event / keyboard event
- [ ] form・media・dialog・popover の仕様イベント

## 7. Component model

- [ ] Shadow DOM
- [ ] `Element.slot`
- [ ] Custom Elements
- [ ] custom element 用 `[HTMLConstructor]`
- [ ] `ElementInternals`
- [ ] `setHTML` / `setHTMLUnsafe`
- [ ] shadow root を含む serialization

## 8. Window and platform services

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

### Networking and resource loading

- [ ] resource loading
- [ ] `fetch`
- [ ] `Request` と fetch 関連 global の realm 公開

### Storage and state

- [ ] cookie
- [ ] storage

### Workers

- [ ] Dedicated Worker (`Worker`)

## 9. Runtime scheduling

- [ ] timers
- [ ] task queue / microtask queue
- [ ] event dispatch と microtask の連携
- [ ] `MutationObserver`
- [ ] JavaScript execution と event loop の統合

## 10. Optional JavaScript execution

- [ ] JavaScript realm
- [ ] `<script>` の実行
- [ ] classic script / module script
- [ ] external script loading
- [ ] parser-blocking script
- [ ] `document.currentScript`
- [ ] WPT が使用する ECMAScript 構文と engine262 parser の互換性
- [ ] `/\${([^ }]*)}/g` を `Invalid decimal digits` とする RegExp literal parse error

## 11. Web IDL bindings

- [ ] argument conversion の網羅
- [ ] 例外変換の網羅
- [ ] property descriptor の網羅
- [ ] interface constructor / prototype / iterable の global 公開 set
- [ ] 既存 DOM API の page realm binding 網羅
- [ ] `Node.cloneNode` の page realm binding
- [ ] branding check と `DOMException` name / code の整合

## 12. Standards compliance measurement

- [x] html5lib tree-construction tests の実行基盤
- [x] tree-construction 適合度レポート
- [x] DOM API 適合度レポート
- [ ] Selector API の適合度計測方法
- [ ] Selector API 適合度レポート
- [ ] HTML element interface 適合度レポート
- [x] WPT の実行可能条件と対象範囲の明示
- [ ] WPT から palim 単体で実行可能なケースの整理
- [x] Window 用 WPT execution adapter
- [x] 除外ケースごとのファイル名・内容・理由
- [ ] Living Standard 更新時の差分検出
- [x] report 更新タイミングの規約化
- [x] URL 単位の10並列 campaign、途中集計、中断・再開
- [x] default scope 1,226 URL の初回完走レポート
- [ ] commit 済み revision のみで report を更新する運用

### WPT baseline 2026-11-05

`wpt/wpt@4fa34c721570cad34ee7283bf531811eafed6010` の default scope を全件実行した。
URL 単位では 1,226 件中 pass 209、fail 496、error 236、timeout 285、pending 0 である。
subtest 単位では 52,021 件中 pass 6,707 である。

- [ ] commit 済みの clean build で baseline を再取得する
- [ ] baseline との差分を URL status と subtest status の両方で比較する
- [ ] harness blocker、未実装 API、algorithm 差、runner failure を別々に集計する
- [ ] timeout 285 件を capability 不足、event loop 待機、外部 resource 待機、runner 停止に分類する
- [ ] `palim returned no WPT result` の13件を runner error として原因保存する
- [ ] HTML parsing 173件を一つの RegExp literal parse error が遮断する状態を解消する
- [ ] `/dom/ranges/` 69件の page realm binding と Range algorithm を段階別に計測する
- [ ] `/dom/nodes/` の `moveBefore` 60 URL と insertion/removing steps 20 URL を独立した進捗項目にする
- [ ] `/dom/events/` の testdriver/layout 依存ケースと DOM event algorithm ケースを分離する
- [ ] `/url/` の fetch 依存29件と Worker依存ケースを URL implementation の失敗から分離する
- [ ] WPT report の failure message を安定した failure kind に正規化する

## 13. Performance and memory

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

## 14. Incremental capability architecture

- [ ] parser、DOM、Window、JavaScript execution の依存方向を分離
- [ ] parser 利用時に Window 関連コードを読み込まない構成
- [ ] capability 単位の package export
- [ ] optional layer ごとの性能・メモリ計測
- [ ] 対応能力を機械可読な metadata として公開
- [ ] JavaScript execution を無効化した軽量構成の維持
