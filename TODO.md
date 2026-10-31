# TODO

## 1. HTML parsing / DOM tree construction

- [ ] html5lib tree-construction tests の実行基盤
- [ ] fragment parsing
- [ ] `innerHTML` など、context element を使用する parse
- [ ] parser error の公開方法
- [ ] byte input と encoding detection
- [ ] scripting flag を含む parser option
- [ ] HTML serialization
- [ ] XML/XHTML/SVG parsing

## 2. Standard DOM interfaces

- [ ] `Document.createElement` / `createElementNS`
- [ ] `createTextNode` / `createComment` / `createDocumentFragment`
- [ ] `cloneNode` / `importNode` / `adoptNode`
- [ ] `Node.normalize`
- [ ] `compareDocumentPosition`
- [ ] `contains`
- [ ] `isEqualNode` / `isSameNode`
- [ ] `getRootNode`
- [ ] `Element.classList`
- [ ] `Element.id` / `className` / `slot`
- [ ] `NamedNodeMap` の取得・設定・削除 API
- [ ] `getElementsByTagName` / `getElementsByClassName`
- [ ] `Document.getElementById`
- [ ] `NodeIterator` / `TreeWalker`
- [ ] `Range`
- [ ] `MutationObserver`
- [ ] Shadow DOM
- [ ] Custom Elements
- [ ] Web IDL の argument conversion・例外・property descriptor の網羅

## 3. HTML element behavior

- [ ] form submission / reset / constraint validation
- [ ] form-associated element の完全な owner 解決
- [ ] input type ごとの value sanitization
- [ ] selection API の type 別制約
- [ ] table mutation algorithm の全境界条件
- [ ] dialog / popover の top layer と event
- [ ] focus management
- [ ] editing API と `contenteditable`
- [ ] media loading・再生状態・track
- [ ] canvas rendering context
- [ ] iframe/object/embed の browsing context
- [ ] stylesheet と `LinkStyle`
- [ ] image loading と intrinsic size
- [ ] custom element 用 `[HTMLConstructor]`
- [ ] `ElementInternals`

## 4. HTML manipulation and serialization

- [ ] `innerHTML`
- [ ] `outerHTML`
- [ ] `insertAdjacentHTML`
- [ ] `setHTML` / `setHTMLUnsafe`
- [ ] `Document.write`
- [ ] `DOMParser` の HTML 以外の MIME type
- [ ] `XMLSerializer`
- [ ] template・shadow root を含む serialization

## 5. Querying

- [ ] Selectors Level 4 の未対応構文
- [ ] namespace selector
- [ ] pseudo-class の追加
- [ ] `:scope` の全 context
- [ ] forgiving selector list
- [ ] selector syntax の仕様テスト
- [ ] Selector API の適合度計測方法
- [ ] WPT から palim 単体で実行可能なケースの整理

## 6. Events

- [ ] capture phase
- [ ] listener option の `passive` / `signal`
- [ ] composed path と shadow boundary
- [ ] event retargeting
- [ ] default action
- [ ] UI event / mouse event / pointer event / keyboard event
- [ ] form・media・dialog・popover の仕様イベント
- [ ] microtask と event loop の連携

## 7. Window environment

- [ ] `Window`
- [ ] `Document.defaultView`
- [ ] `Location`
- [ ] `History`
- [ ] `Navigator`
- [ ] browsing context
- [ ] origin と URL
- [ ] timers
- [ ] task queue / microtask queue
- [ ] resource loading
- [ ] cookie
- [ ] storage
- [ ] `fetch`
- [ ] Window 用 WPT execution adapter

## 8. Optional JavaScript execution

- [ ] JavaScript realm
- [ ] `<script>` の実行
- [ ] classic script / module script
- [ ] external script loading
- [ ] parser-blocking script
- [ ] `document.currentScript`
- [ ] event loop との統合
- [ ] JavaScript execution を無効化した軽量構成の維持

## 9. Standards compliance measurement

- [ ] tree-construction 適合度レポート
- [ ] DOM API 適合度レポート
- [ ] Selector API 適合度レポート
- [ ] HTML element interface 適合度レポート
- [ ] WPT の実行可能条件と対象範囲の明示
- [ ] 除外ケースごとのファイル名・内容・理由
- [ ] Living Standard 更新時の差分検出
- [ ] report 更新タイミングの規約化

## 10. Performance and memory

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
- [ ] commit 済み revision のみで report を更新する運用

## 11. Incremental capability architecture

- [ ] parser、DOM、Window、JavaScript execution の依存方向を分離
- [ ] parser 利用時に Window 関連コードを読み込まない構成
- [ ] capability 単位の package export
- [ ] optional layer ごとの性能・メモリ計測
- [ ] 対応能力を機械可読な metadata として公開
