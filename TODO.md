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

### Node content mutation

- [x] `Node.normalize`

### Node relationships and comparison

- [x] `getRootNode`
- [x] `contains`
- [x] `compareDocumentPosition`
- [x] `isEqualNode` / `isSameNode`

### Attributes and collections

- [x] `Element.classList`
- [x] `Element.id` / `className`
- [x] `NamedNodeMap` の取得・設定・削除 API

### Lookup

- [x] `getElementsByTagName` / `getElementsByTagNameNS` / `getElementsByClassName`
- [x] `Document` / `DocumentFragment.getElementById`

### Traversal and ranges

- [x] `NodeIterator` / `TreeWalker`
- [x] `Range`

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

### Loading, rendering, and embedded content

- [ ] media loading・再生状態・track
- [ ] canvas rendering context
- [ ] iframe/object/embed の browsing context
- [ ] iframe の独立 realm と cross-realm DOM object binding
- [ ] stylesheet と `LinkStyle`
- [ ] image loading と intrinsic size

### Forms and controls

- [ ] form submission / reset / constraint validation
- [ ] form-associated element の完全な owner 解決
- [ ] input type ごとの value sanitization
- [ ] selection API の type 別制約

## 6. Events

- [ ] capture phase
- [x] listener option の `passive`
- [x] listener option の `signal`
- [ ] composed path と shadow boundary
- [ ] event retargeting
- [ ] default action
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
- [ ] origin と URL
- [ ] dialog / popover の top layer と event

### Networking and resource loading

- [ ] resource loading
- [ ] `fetch`

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

## 11. Web IDL bindings

- [ ] argument conversion の網羅
- [ ] 例外変換の網羅
- [ ] property descriptor の網羅

## 12. Standards compliance measurement

- [x] html5lib tree-construction tests の実行基盤
- [x] tree-construction 適合度レポート
- [ ] DOM API 適合度レポート
- [ ] Selector API の適合度計測方法
- [ ] Selector API 適合度レポート
- [ ] HTML element interface 適合度レポート
- [ ] WPT の実行可能条件と対象範囲の明示
- [ ] WPT から palim 単体で実行可能なケースの整理
- [ ] Window 用 WPT execution adapter
- [ ] 除外ケースごとのファイル名・内容・理由
- [ ] Living Standard 更新時の差分検出
- [ ] report 更新タイミングの規約化
- [ ] commit 済み revision のみで report を更新する運用

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
