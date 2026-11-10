# WPT progress report

Run status: failed

Source: wpt/wpt@4fa34c721570cad34ee7283bf531811eafed6010

Campaign: 20261110t121915688z-448589

Campaign state: completed

Palim: c15c556e6ec5c57ac03165a89c58cc5c3686ef67 (dirty)

Container image: sha256:9c349b450ac847542afe3d63d0df408eee9750646b3448ee8aab414899f31d06

Snapshot: 2026-11-10T13:03:45.663Z

Attempts: 1926; worker failures: 0; retries: 0

## URL progress

| Area | Total | Executed | Pass | Fail | Skip | Error | Timeout | Pending | Progress | Pass rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| All | 1926 | 1926 | 591 | 679 | 0 | 381 | 275 | 0 | 100.00% | 30.69% |
| /custom-elements/ | 196 | 196 | 8 | 119 | 0 | 29 | 40 | 0 | 100.00% | 4.08% |
| /dom/collections/ | 12 | 12 | 12 | 0 | 0 | 0 | 0 | 0 | 100.00% | 100.00% |
| /dom/events/ | 214 | 214 | 28 | 68 | 0 | 21 | 97 | 0 | 100.00% | 13.08% |
| /dom/lists/ | 5 | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 100.00% | 100.00% |
| /dom/nodes/ | 408 | 408 | 271 | 93 | 0 | 6 | 38 | 0 | 100.00% | 66.42% |
| /dom/ranges/ | 69 | 69 | 24 | 33 | 0 | 2 | 10 | 0 | 100.00% | 34.78% |
| /dom/traversal/ | 15 | 15 | 15 | 0 | 0 | 0 | 0 | 0 | 100.00% | 100.00% |
| /domparsing/ | 91 | 91 | 45 | 21 | 0 | 16 | 9 | 0 | 100.00% | 49.45% |
| /html/dom/documents/dom-tree-accessors/ | 57 | 57 | 54 | 2 | 0 | 0 | 1 | 0 | 100.00% | 94.74% |
| /html/dom/elements/ | 70 | 70 | 22 | 33 | 0 | 13 | 2 | 0 | 100.00% | 31.43% |
| /html/syntax/parsing/ | 236 | 236 | 22 | 8 | 0 | 174 | 32 | 0 | 100.00% | 9.32% |
| /html/webappapis/dynamic-markup-insertion/html-unsafe-methods/ | 13 | 13 | 6 | 1 | 0 | 2 | 4 | 0 | 100.00% | 46.15% |
| /sanitizer-api/ | 50 | 50 | 15 | 17 | 0 | 16 | 2 | 0 | 100.00% | 30.00% |
| /shadow-dom/ | 314 | 314 | 36 | 224 | 0 | 15 | 39 | 0 | 100.00% | 11.46% |
| /streams/writable-streams/ | 64 | 64 | 0 | 16 | 0 | 48 | 0 | 0 | 100.00% | 0.00% |
| /url/ | 77 | 77 | 16 | 32 | 0 | 28 | 1 | 0 | 100.00% | 20.78% |
| /xhr/formdata | 28 | 28 | 5 | 12 | 0 | 11 | 0 | 0 | 100.00% | 17.86% |
| /xml/ | 7 | 7 | 7 | 0 | 0 | 0 | 0 | 0 | 100.00% | 100.00% |

## Executed subtests

| Total | Pass | Fail | Skip | Error | Timeout | Pass rate |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 78904 | 52928 | 20467 | 0 | 5246 | 263 | 67.08% |

## Non-passing executed tests

| URL | Status | Message |
| --- | --- | --- |
| /custom-elements/CustomElementRegistry-constructor-and-callbacks-are-held-strongly.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: customElements.get is not a function. (In "customElements.get(tagName)", it is undefined)"</code> |
| /custom-elements/CustomElementRegistry-getName.html | fail | <code>customElements.getName is not a function. (In "customElements.getName(class extends HTMLElement {})", it is undefined)</code> |
| /custom-elements/CustomElementRegistry.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/Document-createElement-customized-builtins.html | fail | <code>assert_true: expected true got false</code> |
| /custom-elements/Document-createElement-svg.svg | fail | <code>Super class [Function HTMLDivElement] is not a constructor</code> |
| /custom-elements/Document-createElement.html | timeout | <code>b'TypeError: Custom element constructor returned a different object\nTypeError: Custom element constructor returned a different object'</code> |
| /custom-elements/Document-createElementNS-customized-builtins.html | fail | <code>assert_true: expected true got false</code> |
| /custom-elements/Document-createElementNS-prefix-timing.html | fail | <code>assert_equals: prefix should be null during constructor (set after construction per step 5.1.3.9) expected (object) null but got (string) "p"</code> |
| /custom-elements/ElementInternals-accessibility-values.html | error | <code>TypeError: this.attachInternals is not a function. (In "this.attachInternals()", it is undefined)</code> |
| /custom-elements/ElementInternals-accessibility.html | error | <code>TypeError: this.attachInternals is not a function. (In "this.attachInternals()", it is undefined)</code> |
| /custom-elements/ElementInternals-accessibility.tentative.html | error | <code>TypeError: this.attachInternals is not a function. (In "this.attachInternals()", it is undefined)</code> |
| /custom-elements/ElementInternals-role.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: customElements.get is not a function. (In "customElements.get(`${role}-element`)", it is undefined)"</code> |
| /custom-elements/HTMLElement-attachInternals.html | fail | <code>Illegal constructor</code> |
| /custom-elements/HTMLElement-constructor.html | fail | <code>Super class [Function HTMLParagraphElement] is not a constructor</code> |
| /custom-elements/adopted-callback.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/append-children-to-new-parent-cycle.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/attribute-changed-callback.html | fail | <code>assert_array_equals: lengths differ, expected array ["attributeChanged"] length 1, got [] length 0</code> |
| /custom-elements/builtin-coverage.html | fail | <code>Super class [Function HTMLAnchorElement] is not a constructor</code> |
| /custom-elements/connected-callbacks-html-fragment-parsing.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/connected-callbacks.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/cross-realm-callback-report-exception.html | timeout | <code>b'ReferenceError: "onerrorCalls" is not defined\n    at &lt;anonymous&gt; (http://web-platform.test:8000/custom-elements/cross-realm-callback-report-exception.html:4:26)\nTypeError: Cannot convert undefined to object\n    at http://web-platform.test:8000/custom-elements/cross-realm-callback-report-exception.html:5:21'</code> |
| /custom-elements/custom-element-reaction-queue.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/customized-built-in-constructor-exceptions.html | fail | <code>MyCustomParagraph cannot be used before initialization</code> |
| /custom-elements/disconnected-callbacks.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/element-internals-aria-element-reflection-shadow-including-root.tentative.html | error | <code>TypeError: this.attachInternals is not a function. (In "this.attachInternals()", it is undefined)</code> |
| /custom-elements/element-internals-aria-element-reflection.html | error | <code>TypeError: this.attachInternals is not a function. (In "this.attachInternals()", it is undefined)</code> |
| /custom-elements/element-internals-behaviors.tentative.html | fail | <code>element.attachInternals is not a function. (In "element.attachInternals({ behaviors: [] })", it is undefined)</code> |
| /custom-elements/element-internals-shadowroot.html | error | <code>TypeError: this.attachInternals is not a function. (In "this.attachInternals()", it is undefined)</code> |
| /custom-elements/enqueue-custom-element-callback-reactions-inside-another-callback.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/form-associated/ElementInternals-NotSupportedError.html | fail | <code>Illegal constructor</code> |
| /custom-elements/form-associated/ElementInternals-behavior-accessibility.tentative.html | error | <code>Test named 'Custom element with HTMLSubmitButtonBehavior is implicitly focusable' specified 1 'cleanup' function, and 1 failed.</code> |
| /custom-elements/form-associated/ElementInternals-form.html | error | <code>TypeError: this.attachInternals is not a function. (In "this.attachInternals()", it is undefined)</code> |
| /custom-elements/form-associated/ElementInternals-labels.html | fail | <code>assert_equals: expected (object) Element node &lt;my-control&gt;&lt;/my-control&gt; but got (undefined) undefined</code> |
| /custom-elements/form-associated/ElementInternals-setFormValue-nullish-value.html | error | <code>TypeError: this.attachInternals is not a function. (In "this.attachInternals()", it is undefined)</code> |
| /custom-elements/form-associated/ElementInternals-setFormValue.html | error | <code>ReferenceError: "File" is not defined</code> |
| /custom-elements/form-associated/ElementInternals-setValidity-normalize-newlines.html | fail | <code>Illegal constructor</code> |
| /custom-elements/form-associated/ElementInternals-submit-behavior-dialog.tentative.html | error | <code>Test named 'Custom submit button with form method=dialog closes dialog with behavior value' specified 1 'cleanup' function, and 1 failed.</code> |
| /custom-elements/form-associated/ElementInternals-submit-behavior.tentative.html | error | <code>Test named 'HTMLSubmitButtonBehavior properties have correct default values' specified 1 'cleanup' function, and 1 failed.</code> |
| /custom-elements/form-associated/ElementInternals-target-element-is-held-strongly.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: targetElement.attachInternals is not a function. (In "targetElement.attachInternals()", it is undefined)"</code> |
| /custom-elements/form-associated/ElementInternals-validation.html | error | <code>TypeError: this.attachInternals is not a function. (In "this.attachInternals()", it is undefined)</code> |
| /custom-elements/form-associated/disabled-delegatesFocus.html | error | <code>TypeError: this.attachInternals is not a function. (In "this.attachInternals()", it is undefined)</code> |
| /custom-elements/form-associated/fieldset-elements-after-upgrade.html | fail | <code>Cannot convert undefined to object</code> |
| /custom-elements/form-associated/fieldset-elements-during-construction.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/form-associated/fieldset-elements.html | fail | <code>Cannot convert undefined to object</code> |
| /custom-elements/form-associated/focusability.html | fail | <code>foo.focus is not a function. (In "foo.focus()", it is undefined)</code> |
| /custom-elements/form-associated/form-associated-callback.html | error | <code>TypeError: this.attachInternals is not a function. (In "this.attachInternals()", it is undefined)</code> |
| /custom-elements/form-associated/form-disabled-callback.html | error | <code>TypeError: this.attachInternals is not a function. (In "this.attachInternals()", it is undefined)</code> |
| /custom-elements/form-associated/form-disabled-legend.html | fail | <code>assert_true: in legend :enabled expected true got false</code> |
| /custom-elements/form-associated/form-elements-namedItem.html | fail | <code>Cannot convert undefined to object</code> |
| /custom-elements/form-associated/form-reset-callback.html | fail | <code>form.reset is not a function. (In "form.reset()", it is undefined)</code> |
| /custom-elements/form-associated/label-delegatesFocus.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/htmlconstructor/newtarget-customized-builtins.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/htmlconstructor/newtarget.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/microtasks-and-constructors.html | fail | <code>assert_array_equals: lengths differ, expected array ["promise microtask", "MutationObserver microtask"] length 2, got ["promise microtask"] length 1</code> |
| /custom-elements/overwritten-customElements-global.html | fail | <code>Illegal constructor</code> |
| /custom-elements/parser/parser-constructs-custom-element-in-document-write.html | error | <code>TypeError: document.write is not a function. (In "document.write('&lt;my-custom-element&gt;hello &lt;b&gt;world&lt;/b&gt;&lt;/my-custom-element&gt;')", it is undefined)</code> |
| /custom-elements/parser/parser-constructs-custom-elements-with-is.html | fail | <code>assert_true: A resolved custom element must be an instance of that custom element expected true got false</code> |
| /custom-elements/parser/parser-custom-element-in-foreign-content.html | fail | <code>"SVGElement" is not defined</code> |
| /custom-elements/parser/parser-fallsback-to-unknown-element.html | fail | <code>assert_true: The fallback element created by HTML parser must be an instance of HTMLUnknownElement expected true got false</code> |
| /custom-elements/parser/parser-sets-attributes-after-autonomous-constructor.html | error | <code>TypeError: The childList option must be true</code> |
| /custom-elements/parser/parser-sets-attributes-after-built-in-constructor.html | error | <code>TypeError: The childList option must be true</code> |
| /custom-elements/parser/parser-sets-attributes-and-children.html | fail | <code>assert_equals: expected 2 but got 0</code> |
| /custom-elements/parser/parser-uses-constructed-element.html | fail | <code>assert_not_equals: HTML parser must not insert another instance of the custom element created before super() call got disallowed value Element node &lt;instantiates-itself-before-super&gt;&lt;/instantiates-itself-b...</code> |
| /custom-elements/parser/parser-uses-create-an-element-for-a-token-svg.svg | error | <code>TypeError: Super class [Function HTMLDivElement] is not a constructor</code> |
| /custom-elements/parser/parser-uses-registry-of-owner-document.html | error | <code>TypeError: document.write is not a function. (In "document.write('&lt;template&gt;&lt;my-custom-element&gt;&lt;/my-custom-element&gt;&lt;/template&gt;')", it is undefined)</code> |
| /custom-elements/parser/serializing-html-fragments-customized-builtins.html | fail | <code>Super class [Function HTMLParagraphElement] is not a constructor</code> |
| /custom-elements/parser/xml-parser-custom-element-reparents-during-construction.xhtml | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "Blob" is not defined"</code> |
| /custom-elements/perform-microtask-checkpoint-before-construction-xml-parser.xhtml | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "Blob" is not defined"</code> |
| /custom-elements/perform-microtask-checkpoint-before-construction.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/pseudo-class-defined-customized-builtins.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/pseudo-class-defined.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/range-and-constructors.html | fail | <code>assert_array_equals: expected property 0 to be "root-0" but got "" (expected array ["root-0", "root-0-0", "root-1"] got ["", "", ""])</code> |
| /custom-elements/reaction-timing.html | fail | <code>assert_equals: expected 4 but got 0</code> |
| /custom-elements/reactions/Animation.html | fail | <code>instance.animate is not a function. (In "instance.animate([{'borderColor': 'rgb(0, 0, 255)'}], 1)", it is undefined)</code> |
| /custom-elements/reactions/AriaMixin-element-attributes.html | fail | <code>assert_array_equals: lengths differ, expected array ["attributeChanged"] length 1, got [] length 0</code> |
| /custom-elements/reactions/AriaMixin-string-attributes.html | fail | <code>assert_array_equals: lengths differ, expected array ["attributeChanged"] length 1, got [] length 0</code> |
| /custom-elements/reactions/AriaMixin-string-attributes.tentative.html | fail | <code>assert_array_equals: lengths differ, expected array ["attributeChanged"] length 1, got [] length 0</code> |
| /custom-elements/reactions/Attr.html | fail | <code>assert_array_equals: lengths differ, expected array ["constructed", "attributeChanged"] length 2, got ["constructed"] length 1</code> |
| /custom-elements/reactions/CSSStyleDeclaration.html | fail | <code>assert_array_equals: lengths differ, expected array ["attributeChanged"] length 1, got [] length 0</code> |
| /custom-elements/reactions/ChildNode.html | fail | <code>assert_array_equals: lengths differ, expected array ["disconnected", "adopted", "connected"] length 3, got ["disconnected", "connected"] length 2</code> |
| /custom-elements/reactions/DOMStringMap.html | fail | <code>assert_array_equals: lengths differ, expected array ["attributeChanged"] length 1, got [] length 0</code> |
| /custom-elements/reactions/DOMTokenList.html | fail | <code>assert_array_equals: lengths differ, expected array ["attributeChanged"] length 1, got [] length 0</code> |
| /custom-elements/reactions/Document.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/reactions/Element.html | fail | <code>assert_array_equals: lengths differ, expected array ["attributeChanged"] length 1, got [] length 0</code> |
| /custom-elements/reactions/ElementContentEditable.html | fail | <code>assert_array_equals: lengths differ, expected array ["attributeChanged"] length 1, got [] length 0</code> |
| /custom-elements/reactions/HTMLAnchorElement.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/reactions/HTMLElement.html | error | <code>assert_array_equals: lengths differ, expected array ["attributeChanged"] length 1, got [] length 0</code> |
| /custom-elements/reactions/HTMLOptionElement.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/reactions/HTMLOptionsCollection.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/reactions/HTMLOutputElement.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/reactions/HTMLSelectElement.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/reactions/HTMLTableElement.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/reactions/HTMLTableRowElement.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/reactions/HTMLTableSectionElement.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/reactions/HTMLTitleElement.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/reactions/NamedNodeMap.html | fail | <code>assert_array_equals: lengths differ, expected array ["attributeChanged"] length 1, got [] length 0</code> |
| /custom-elements/reactions/Node.html | fail | <code>assert_array_equals: lengths differ, expected array ["constructed", "attributeChanged"] length 2, got ["constructed"] length 1</code> |
| /custom-elements/reactions/ParentNode.html | fail | <code>assert_array_equals: lengths differ, expected array ["disconnected", "adopted", "connected"] length 3, got ["disconnected", "connected"] length 2</code> |
| /custom-elements/reactions/Range.html | fail | <code>assert_array_equals: lengths differ, expected array ["constructed", "connected", "attributeChanged"] length 3, got ["constructed", "connected"] length 2</code> |
| /custom-elements/reactions/Selection.html | fail | <code>window.getSelection is not a function. (In "window.getSelection()", it is undefined)</code> |
| /custom-elements/reactions/ShadowRoot.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/reactions/customized-builtins/HTMLAreaElement.html | fail | <code>Super class [Function HTMLAreaElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLBaseElement.html | fail | <code>Super class [Function HTMLBaseElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLButtonElement.html | fail | <code>Super class [Function HTMLButtonElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLCanvasElement.html | fail | <code>Super class [Function HTMLCanvasElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLDataElement.html | fail | <code>Super class [Function HTMLDataElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLDetailsElement.html | fail | <code>Super class [Function HTMLDetailsElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLEmbedElement.html | fail | <code>Super class [Function HTMLEmbedElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLFieldSetElement.html | fail | <code>Super class [Function HTMLFieldSetElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLImageElement.html | fail | <code>Super class [Function HTMLImageElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLLIElement.html | fail | <code>Super class [Function HTMLLIElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLLabelElement.html | fail | <code>Super class [Function HTMLLabelElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLMapElement.html | fail | <code>Super class [Function HTMLMapElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLMediaElement.html | fail | <code>Super class [Function HTMLAudioElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLMetaElement.html | fail | <code>Super class [Function HTMLMetaElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLMeterElement.html | fail | <code>Super class [Function HTMLMeterElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLModElement.html | fail | <code>Super class [Function HTMLModElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLOListElement.html | fail | <code>Super class [Function HTMLOListElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLOptGroupElement.html | fail | <code>Super class [Function HTMLOptGroupElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLParamElement.html | fail | <code>Super class [Function HTMLParamElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLProgressElement.html | fail | <code>Super class [Function HTMLProgressElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLQuoteElement.html | fail | <code>Super class [Function HTMLQuoteElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLSlotElement.html | fail | <code>Super class [Function HTMLSlotElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLSourceElement.html | fail | <code>Super class [Function HTMLSourceElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLStyleElement.html | fail | <code>Super class [Function HTMLStyleElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLTableCellElement.html | fail | <code>Super class [Function HTMLTableCellElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLTableColElement.html | fail | <code>Super class [Function HTMLTableColElement] is not a constructor</code> |
| /custom-elements/reactions/customized-builtins/HTMLTimeElement.html | fail | <code>Super class [Function HTMLTimeElement] is not a constructor</code> |
| /custom-elements/reactions/with-exceptions.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/registries/Construct.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/CustomElementRegistry-define.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/CustomElementRegistry-initialize.html | fail | <code>assert_throws_dom: function "() =&gt; window.customElements.initialize(document)" threw object "TypeError: window.customElements.initialize is not a function. (In "window.customElements.initialize(document)", it is undefined)" that is not a DOMException NotSupportedError: property "code" is equal to undefined, expected 9</code> |
| /custom-elements/registries/CustomElementRegistry-multi-register.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/CustomElementRegistry-upgrade.html | fail | <code>assert_equals: expected "function" but got "undefined"</code> |
| /custom-elements/registries/Document-createElement.html | error | <code>TypeError: [Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/Document-createElementNS.html | error | <code>TypeError: [Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/Document-customElementRegistry.html | fail | <code>assert_equals: expected (object) object "[object Object]" but got (undefined) undefined</code> |
| /custom-elements/registries/Document-importNode-cross-document.window.html | fail | <code>assert_equals: expected (object) object "[object Object]" but got (undefined) undefined</code> |
| /custom-elements/registries/Document-importNode.html | error | <code>TypeError: [Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/Element-customElementRegistry-exceptions.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/Element-customElementRegistry.html | fail | <code>assert_equals: expected (object) object "[object Object]" but got (undefined) undefined</code> |
| /custom-elements/registries/Element-innerHTML.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/ShadowRoot-init-customElementRegistry.html | fail | <code>assert_equals: expected (object) object "[object Object]" but got (undefined) undefined</code> |
| /custom-elements/registries/ShadowRoot-init-declarative.html | fail | <code>Cannot convert null to object</code> |
| /custom-elements/registries/ShadowRoot-innerHTML.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/adoption.window.html | fail | <code>assert_equals: expected (object) object "[object Object]" but got (undefined) undefined</code> |
| /custom-elements/registries/constructor-direct-call-fallback-registry.window.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/constructor-reentry-createElement.window.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/constructor-reentry-with-different-definition.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/define-customized-builtins.html | fail | <code>assert_throws_dom: function "() =&gt;  {<br>        customElements.define('test-define-extend-valid-name', class {}, { extends: name });<br>      }" did not throw</code> |
| /custom-elements/registries/define.html | fail | <code>The custom element name is invalid</code> |
| /custom-elements/registries/element-mutation-null-registry-removal.html | fail | <code>Cannot convert null to object</code> |
| /custom-elements/registries/element-mutation.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/global.window.html | fail | <code>assert_throws_dom: function "() =&gt; customElements.initialize(contentDocument)" threw object "TypeError: customElements.initialize is not a function. (In "customElements.initialize(contentDocument)", it is undefined)" that is not a DOMException NotSupportedError: property "code" is equal to undefined, expected 9</code> |
| /custom-elements/registries/initial-about-blank.window.html | fail | <code>assert_true: expected true got false</code> |
| /custom-elements/registries/per-document.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/registries/pseudo-class-defined.window.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/scoped-custom-element-registry-customelementregistry-attribute-in-xhtml.xhtml | fail | <code>assert_equals: expected (object) null but got (undefined) undefined</code> |
| /custom-elements/registries/scoped-custom-element-registry-customelementregistry-attribute.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/registries/scoped-registry-append.html | fail | <code>assert_equals: expected (object) null but got (undefined) undefined</code> |
| /custom-elements/registries/scoped-registry-define-upgrade-criteria.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/scoped-registry-define-upgrade-order.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/scoped-registry-effective-global-registry.html | error | <code>TypeError: [Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/scoped-registry-initialize-upgrades.html | fail | <code>assert_equals: expected (object) null but got (undefined) undefined</code> |
| /custom-elements/registries/scoped-registry-initialize.html | error | <code>TypeError: [Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/scoped-registry-registry-define-get-etc.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /custom-elements/registries/template.window.html | fail | <code>assert_equals: expected (string) "" but got (undefined) undefined</code> |
| /custom-elements/registries/upgrade.html | fail | <code>customElements.upgrade is not a function. (In "customElements.upgrade(el)", it is undefined)</code> |
| /custom-elements/registries/valid-custom-element-names.html | timeout | <code>promise_test: Unhandled rejection with value: object "TypeError: customElements.whenDefined is not a function. (In "customElements.whenDefined(validName)", it is undefined)"</code> |
| /custom-elements/shadow-descendant-lifecycle-order.html | fail | <code>customElements.upgrade is not a function. (In "customElements.upgrade(root)", it is undefined)</code> |
| /custom-elements/state/ElementInternals-states.html | fail | <code>Illegal constructor</code> |
| /custom-elements/state/custom-state-set-strong-ref.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: Cannot convert undefined to object"</code> |
| /custom-elements/state/state-css-selector-nth-of.html | error | <code>Test named 'state selector has influence on nth-of when state is applied' specified 2 'cleanup' functions, and 2 failed.</code> |
| /custom-elements/state/state-css-selector-shadow-dom.html | fail | <code>Cannot convert undefined to object</code> |
| /custom-elements/state/state-css-selector.html | fail | <code>Cannot convert undefined to object</code> |
| /custom-elements/state/state-pseudo-class.html | fail | <code>The selector is invalid.</code> |
| /custom-elements/throw-on-dynamic-markup-insertion-counter-construct-xml-parser.xhtml | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "Blob" is not defined"</code> |
| /custom-elements/throw-on-dynamic-markup-insertion-counter-construct.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/throw-on-dynamic-markup-insertion-counter-reactions-xml-parser.xhtml | timeout | <code>palim execution timed out</code> |
| /custom-elements/throw-on-dynamic-markup-insertion-counter-reactions.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/upgrading.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/upgrading/Document-importNode-customized-builtins.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/upgrading/Document-importNode.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/upgrading/Node-cloneNode-customized-builtins.html | fail | <code>Super class [Function HTMLDivElement] is not a constructor</code> |
| /custom-elements/upgrading/Node-cloneNode.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/upgrading/upgrade-custom-element-error-event.html | error | <code>TypeError: Super class [Function HTMLDivElement] is not a constructor</code> |
| /custom-elements/upgrading/upgrading-enqueue-reactions.html | timeout | <code>palim execution timed out</code> |
| /custom-elements/upgrading/upgrading-parser-created-element.html | fail | <code>assert_true: Calling customElements.define must upgrade existing custom elements expected true got false</code> |
| /dom/events/AddEventListenerOptions-passive.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /dom/events/AddEventListenerOptions-signal.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /dom/events/Body-FrameSet-Event-Handlers.html | fail | <code>assert_equals: Initially null expected (object) null but got (undefined) undefined</code> |
| /dom/events/Event-cancelBubble.html | fail | <code>assert_false: cancelBubble must be false after an event has been dispatched. expected false got true</code> |
| /dom/events/Event-constructors.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /dom/events/Event-dispatch-bubble-canceled.html | fail | <code>assert_array_equals: actual_targets lengths differ, expected array [] length 0, got [Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, [...]] length 2</code> |
| /dom/events/Event-dispatch-bubbles-false.html | fail | <code>assert_array_equals: targets lengths differ, expected array [object "[object Object]", Document node with 2 children, Element node &lt;html&gt;&lt;head&gt;&lt;meta charset="utf-8"&gt;<br>&lt;title&gt; Event.bubbles ..., Element node &lt;body&gt;&lt;div id="log"&gt;&lt;/div&gt;<br>&lt;table id="table" border="1" s..., Element node &lt;table id="table" border="1" style="display: none"&gt;<br>    &lt;..., Element node &lt;tbody id="table-body"&gt;<br>    &lt;tr id="table-row"&gt;<br>        &lt;..., Element node &lt;tr id="parent"&gt;<br>        &lt;td id="target"&gt;Over the river, ..., Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, [...]] length 9, got [Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, [...]] length 2</code> |
| /dom/events/Event-dispatch-bubbles-true.html | fail | <code>assert_array_equals: targets lengths differ, expected array [object "[object Object]", Document node with 2 children, Element node &lt;html&gt;&lt;head&gt;&lt;meta charset="utf-8"&gt;<br>&lt;title&gt; Event.bubbles ..., Element node &lt;body&gt;&lt;div id="log"&gt;&lt;/div&gt;<br>&lt;table id="table" border="1" s..., Element node &lt;table id="table" border="1" style="display: none"&gt;<br>    &lt;..., Element node &lt;tbody id="table-body"&gt;<br>    &lt;tr id="table-row"&gt;<br>        &lt;..., Element node &lt;tr id="parent"&gt;<br>        &lt;td id="target"&gt;Over the river, ..., Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, [...], [...], [...], [...], [...], [...], [...], [...]] length 16, got [Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, [...], Element node &lt;tr id="parent"&gt;<br>        &lt;td id="target"&gt;Over the river, ..., [...], Element node &lt;tbody id="table-body"&gt;<br>    &lt;tr id="table-row"&gt;<br>        &lt;..., [...], Element node &lt;table id="table" border="1" style="display: none"&gt;<br>    &lt;..., [...], Element node &lt;body&gt;&lt;div id="log"&gt;&lt;/div&gt;<br>&lt;table id="table" border="1" s..., [...], Element node &lt;html&gt;&lt;head&gt;&lt;meta charset="utf-8"&gt;<br>&lt;title&gt; Event.bubbles ..., [...], Document node with 2 children, [...]] length 14</code> |
| /dom/events/Event-dispatch-click.html | timeout | <code>palim execution timed out</code> |
| /dom/events/Event-dispatch-click.tentative.html | fail | <code>label.click is not a function. (In "label.click()", it is undefined)</code> |
| /dom/events/Event-dispatch-detached-input-and-change.html | fail | <code>input.click is not a function. (In "input.click()", it is undefined)</code> |
| /dom/events/Event-dispatch-handlers-changed.html | fail | <code>assert_array_equals: actual_targets lengths differ, expected array [object "[object Object]", Document node with 2 children, Element node &lt;html&gt;&lt;head&gt;&lt;meta charset="utf-8"&gt;<br>&lt;title&gt; Dispatch addit..., Element node &lt;body&gt;&lt;div id="log"&gt;&lt;/div&gt;<br><br>&lt;table id="table" border="1" ..., Element node &lt;table id="table" border="1" style="display: none"&gt;<br>    &lt;..., Element node &lt;tbody id="table-body"&gt;<br>    &lt;tr id="table-row"&gt;<br>        &lt;..., Element node &lt;tr id="parent"&gt;<br>        &lt;td id="target"&gt;Over the river, ..., Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, [...], [...], [...], [...], [...], [...], [...], [...], [...]] length 17, got [Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, [...], Element node &lt;tr id="parent"&gt;<br>        &lt;td id="target"&gt;Over the river, ..., [...], Element node &lt;tbody id="table-body"&gt;<br>    &lt;tr id="table-row"&gt;<br>        &lt;..., [...], Element node &lt;table id="table" border="1" style="display: none"&gt;<br>    &lt;..., [...], Element node &lt;body&gt;&lt;div id="log"&gt;&lt;/div&gt;<br><br>&lt;table id="table" border="1" ..., [...], Element node &lt;html&gt;&lt;head&gt;&lt;meta charset="utf-8"&gt;<br>&lt;title&gt; Dispatch addit..., [...], Document node with 2 children, [...]] length 14</code> |
| /dom/events/Event-dispatch-listener-order.window.html | fail | <code>assert_array_equals: lengths differ, expected array ["capturing SECTION", "capturing DIV", "capturing #document-fragment", "capturing P", "capturing SPAN", "bubbling SPAN", "bubbling P", "bubbling #document-fragment", "bubbling DIV", "bubbling SECTION"] length 10, got ["bubbling SPAN", "capturing SPAN", "bubbling P", "capturing P", "bubbling #document-fragment", "capturing #document-fragment"] length 6</code> |
| /dom/events/Event-dispatch-multiple-cancelBubble.html | fail | <code>assert_array_equals: lengths differ, expected array [Document node with 2 children, object "[object Object]"] length 2, got [Document node with 2 children] length 1</code> |
| /dom/events/Event-dispatch-multiple-stopPropagation.html | fail | <code>assert_array_equals: lengths differ, expected array [Document node with 2 children, object "[object Object]"] length 2, got [Document node with 2 children] length 1</code> |
| /dom/events/Event-dispatch-omitted-capture.html | fail | <code>assert_array_equals: targets lengths differ, expected array [Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, Element node &lt;tr id="parent"&gt;<br>        &lt;td id="target"&gt;Over the river, ..., Element node &lt;tbody id="table-body"&gt;<br>    &lt;tr id="table-row"&gt;<br>        &lt;..., Element node &lt;table id="table" border="1" style="display: none"&gt;<br>    &lt;..., Element node &lt;body&gt;&lt;div id="log"&gt;&lt;/div&gt;<br>&lt;table id="table" border="1" s..., Element node &lt;html&gt;&lt;head&gt;&lt;meta charset="utf-8"&gt;<br>&lt;title&gt;EventTarget.add..., Document node with 2 children, object "[object Object]"] length 8, got [Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, Element node &lt;tr id="parent"&gt;<br>        &lt;td id="target"&gt;Over the river, ..., Element node &lt;tbody id="table-body"&gt;<br>    &lt;tr id="table-row"&gt;<br>        &lt;..., Element node &lt;table id="table" border="1" style="display: none"&gt;<br>    &lt;..., Element node &lt;body&gt;&lt;div id="log"&gt;&lt;/div&gt;<br>&lt;table id="table" border="1" s..., Element node &lt;html&gt;&lt;head&gt;&lt;meta charset="utf-8"&gt;<br>&lt;title&gt;EventTarget.add..., Document node with 2 children] length 7</code> |
| /dom/events/Event-dispatch-on-disabled-elements.html | timeout | <code>elem.click is not a function. (In "elem.click()", it is undefined)</code> |
| /dom/events/Event-dispatch-order-at-target.html | fail | <code>assert_array_equals: bubbles: true expected property 0 to be "capturing" but got "bubbling" (expected array ["capturing", "bubbling"] got ["bubbling", "capturing"])</code> |
| /dom/events/Event-dispatch-order.html | timeout | <code>palim execution timed out</code> |
| /dom/events/Event-dispatch-propagation-stopped.html | fail | <code>assert_array_equals: actual_targets lengths differ, expected array [] length 0, got [Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, [...]] length 2</code> |
| /dom/events/Event-dispatch-redispatch.html | timeout | <code>b'ReferenceError: "requestAnimationFrame" is not defined\n    at &lt;anonymous&gt; (http://web-platform.test:8000/dom/events/Event-dispatch-redispatch.html:10:43)'</code> |
| /dom/events/Event-dispatch-reenter.html | fail | <code>assert_array_equals: actual_targets lengths differ, expected array [object "[object Object]", Document node with 2 children, Element node &lt;html&gt;&lt;head&gt;&lt;meta charset="utf-8"&gt;<br>&lt;title&gt; Dispatch addit..., Element node &lt;body&gt;&lt;div id="log"&gt;&lt;/div&gt;<br>&lt;table id="table" border="1" s..., Element node &lt;table id="table" border="1" style="display: none"&gt;<br>    &lt;..., Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, Element node &lt;tr id="parent"&gt;<br>        &lt;td id="target"&gt;Over the river, ..., Element node &lt;tbody id="table-body"&gt;<br>    &lt;tr id="table-row"&gt;<br>        &lt;..., [...], [...], [...], [...], [...], [...], [...], [...]] length 16, got [Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;] length 1</code> |
| /dom/events/Event-dispatch-single-activation-behavior.html | error | <code>39 duplicate test names: "When clicking child &lt;INPUT&gt;&lt;/INPUT&gt; of parent &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;INPUT&gt;&lt;/INPUT&gt; of parent &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;INPUT&gt;&lt;/INPUT&gt; of parent &lt;INPUT&gt;&lt;/INPUT&gt;, only child should be activated.", "When clicking child &lt;INPUT&gt;&lt;/INPUT&gt; of parent &lt;A&gt;&lt;/A&gt;, only child should be activated.", "When clicking child &lt;INPUT&gt;&lt;/INPUT&gt; of parent &lt;AREA&gt;&lt;/AREA&gt;, only child should be activated.", "When clicking child &lt;INPUT&gt;&lt;/INPUT&gt; of parent &lt;DETAILS&gt;&lt;SUMMARY&gt;&lt;/SUMMARY&gt;&lt;/DETAILS&gt;, only child should be activated.", "When clicking child &lt;INPUT&gt;&lt;/INPUT&gt; of parent &lt;LABEL&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;SPAN&gt;&lt;/SPAN&gt;&lt;/LABEL&gt;, only child should be activated.", "When clicking child &lt;INPUT&gt;&lt;/INPUT&gt; of parent &lt;LABEL&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/LABEL&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt; of parent &lt;INPUT&gt;&lt;/INPUT&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt; of parent &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt; of parent &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt; of parent &lt;A&gt;&lt;/A&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt; of parent &lt;AREA&gt;&lt;/AREA&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt; of parent &lt;DETAILS&gt;&lt;SUMMARY&gt;&lt;/SUMMARY&gt;&lt;/DETAILS&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt; of parent &lt;LABEL&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;SPAN&gt;&lt;/SPAN&gt;&lt;/LABEL&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt; of parent &lt;LABEL&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/LABEL&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt; of parent &lt;INPUT&gt;&lt;/INPUT&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt; of parent &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt; of parent &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt; of parent &lt;A&gt;&lt;/A&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt; of parent &lt;AREA&gt;&lt;/AREA&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt; of parent &lt;DETAILS&gt;&lt;SUMMARY&gt;&lt;/SUMMARY&gt;&lt;/DETAILS&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt; of parent &lt;LABEL&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;SPAN&gt;&lt;/SPAN&gt;&lt;/LABEL&gt;, only child should be activated.", "When clicking child &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt; of parent &lt;LABEL&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/LABEL&gt;, only child should be activated.", "When clicking child &lt;A&gt;&lt;/A&gt; of parent &lt;INPUT&gt;&lt;/INPUT&gt;, only child should be activated.", "When clicking child &lt;A&gt;&lt;/A&gt; of parent &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;A&gt;&lt;/A&gt; of parent &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;AREA&gt;&lt;/AREA&gt; of parent &lt;INPUT&gt;&lt;/INPUT&gt;, only child should be activated.", "When clicking child &lt;AREA&gt;&lt;/AREA&gt; of parent &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;AREA&gt;&lt;/AREA&gt; of parent &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;DETAILS&gt;&lt;SUMMARY&gt;&lt;/SUMMARY&gt;&lt;/DETAILS&gt; of parent &lt;INPUT&gt;&lt;/INPUT&gt;, only child should be activated.", "When clicking child &lt;DETAILS&gt;&lt;SUMMARY&gt;&lt;/SUMMARY&gt;&lt;/DETAILS&gt; of parent &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;DETAILS&gt;&lt;SUMMARY&gt;&lt;/SUMMARY&gt;&lt;/DETAILS&gt; of parent &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;LABEL&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;SPAN&gt;&lt;/SPAN&gt;&lt;/LABEL&gt; of parent &lt;INPUT&gt;&lt;/INPUT&gt;, only child should be activated.", "When clicking child &lt;LABEL&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;SPAN&gt;&lt;/SPAN&gt;&lt;/LABEL&gt; of parent &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;LABEL&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;SPAN&gt;&lt;/SPAN&gt;&lt;/LABEL&gt; of parent &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;LABEL&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/LABEL&gt; of parent &lt;INPUT&gt;&lt;/INPUT&gt;, only child should be activated.", "When clicking child &lt;LABEL&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/LABEL&gt; of parent &lt;FORM&gt;&lt;INPUT&gt;&lt;/INPUT&gt;&lt;/FORM&gt;, only child should be activated.", "When clicking child &lt;LABEL&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/LABEL&gt; of parent &lt;FORM&gt;&lt;BUTTON&gt;&lt;/BUTTON&gt;&lt;/FORM&gt;, only child should be activated."</code> |
| /dom/events/Event-dispatch-target-moved.html | fail | <code>assert_array_equals: targets lengths differ, expected array [object "[object Object]", Document node with 2 children, Element node &lt;html&gt;&lt;head&gt;&lt;meta charset="utf-8"&gt;<br>&lt;title&gt; Determined eve..., Element node &lt;body&gt;&lt;div id="log"&gt;&lt;/div&gt;<br>&lt;table id="table" border="1" s..., Element node &lt;table id="table" border="1" style="display: none"&gt;<br>    &lt;..., Element node &lt;tbody id="table-body"&gt;<br>    &lt;tr id="table-row"&gt;<br>        &lt;..., Element node &lt;tr id="parent"&gt;<br>        <br>        &lt;td&gt;Dorian&lt;/td&gt;<br>    &lt;/tr&gt;, Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, [...], [...], [...], [...], [...], [...], [...], [...]] length 16, got [Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, [...], Element node &lt;tr id="parent"&gt;<br>        <br>        &lt;td&gt;Dorian&lt;/td&gt;<br>    &lt;/tr&gt;, [...], Element node &lt;tbody id="table-body"&gt;<br>    &lt;tr id="table-row"&gt;<br>        &lt;..., [...], Element node &lt;table id="table" border="1" style="display: none"&gt;<br>    &lt;..., [...], Element node &lt;body&gt;&lt;div id="log"&gt;&lt;/div&gt;<br>&lt;table id="table" border="1" s..., [...], Element node &lt;html&gt;&lt;head&gt;&lt;meta charset="utf-8"&gt;<br>&lt;title&gt; Determined eve..., [...], Document node with 2 children, [...]] length 14</code> |
| /dom/events/Event-dispatch-target-removed.html | fail | <code>assert_array_equals: targets lengths differ, expected array [object "[object Object]", Document node with 2 children, Element node &lt;html&gt;&lt;head&gt;&lt;meta charset="utf-8"&gt;<br>&lt;title&gt;Determined even..., Element node &lt;body&gt;&lt;div id="log"&gt;&lt;/div&gt;<br>&lt;table id="table" border="1" s..., Element node &lt;table id="table" border="1" style="display: none"&gt;<br>    &lt;..., Element node &lt;tbody id="table-body"&gt;<br>    &lt;tr id="table-row"&gt;<br>        &lt;..., Element node &lt;tr id="parent"&gt;<br>        <br>        &lt;td&gt;Dorian&lt;/td&gt;<br>    &lt;/tr&gt;, Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, [...], [...], [...], [...], [...], [...], [...], [...]] length 16, got [Element node &lt;td id="target"&gt;Over the river, Charlie&lt;/td&gt;, [...], Element node &lt;tr id="parent"&gt;<br>        <br>        &lt;td&gt;Dorian&lt;/td&gt;<br>    &lt;/tr&gt;, [...], Element node &lt;tbody id="table-body"&gt;<br>    &lt;tr id="table-row"&gt;<br>        &lt;..., [...], Element node &lt;table id="table" border="1" style="display: none"&gt;<br>    &lt;..., [...], Element node &lt;body&gt;&lt;div id="log"&gt;&lt;/div&gt;<br>&lt;table id="table" border="1" s..., [...], Element node &lt;html&gt;&lt;head&gt;&lt;meta charset="utf-8"&gt;<br>&lt;title&gt;Determined even..., [...], Document node with 2 children, [...]] length 14</code> |
| /dom/events/Event-dispatch-throwing-multiple-globals.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "event" is not defined"</code> |
| /dom/events/Event-init-while-dispatching.html | fail | <code>"KeyboardEvent" is not defined</code> |
| /dom/events/Event-isTrusted.any.html | fail | <code>assert_not_equals: got disallowed value undefined</code> |
| /dom/events/Event-isTrusted.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /dom/events/Event-propagation.html | fail | <code>assert_equals: Propagation flag expected false but got true</code> |
| /dom/events/Event-stopPropagation-cancel-bubbling.html | fail | <code>"MouseEvent" is not defined</code> |
| /dom/events/Event-subclasses-constructors.html | fail | <code>undefined is not a constructor</code> |
| /dom/events/Event-timestamp-cross-realm-getter.html | timeout | <code>palim execution timed out</code> |
| /dom/events/Event-timestamp-high-resolution.html | fail | <code>"performance" is not defined</code> |
| /dom/events/Event-timestamp-high-resolution.https.html | fail | <code>"performance" is not defined</code> |
| /dom/events/Event-timestamp-safe-resolution.html | fail | <code>"MouseEvent" is not defined</code> |
| /dom/events/EventListener-handleEvent-cross-realm.html | fail | <code>assert_equals: expected "object" but got "undefined"</code> |
| /dom/events/EventListener-incumbent-global-1.sub.html | timeout | <code>palim execution timed out</code> |
| /dom/events/EventListener-incumbent-global-2.sub.html | timeout | <code>palim execution timed out</code> |
| /dom/events/EventListener-invoke-legacy.html | timeout | <code>palim execution timed out</code> |
| /dom/events/EventListenerOptions-capture.html | fail | <code>assert_equals: Incorrect event phase for value: true expected 1 but got 3</code> |
| /dom/events/EventTarget-add-listener-platform-object.html | fail | <code>TypeError: customElement.click is not a function. (In "customElement.click()", it is undefined)</code> |
| /dom/events/EventTarget-add-remove-listener.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /dom/events/EventTarget-addEventListener.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /dom/events/EventTarget-constructible.any.html | error | <code>TypeError: e.composedPath is not a function. (In "e.composedPath()", it is undefined)</code> |
| /dom/events/EventTarget-constructible.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /dom/events/EventTarget-dispatchEvent.html | fail | <code>The event interface "BeforeUnloadEvent" is not supported</code> |
| /dom/events/EventTarget-removeEventListener.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /dom/events/EventTarget-window-constructor.html | fail | <code>assert_equals: expected (object) Element node &lt;body&gt;<br>&lt;script&gt;<br>"use strict";<br><br>test(t =&gt; {<br>  const eventT... but got (undefined) undefined</code> |
| /dom/events/KeyEvent-initKeyEvent.html | fail | <code>The event interface "KeyboardEvent" is not supported</code> |
| /dom/events/click-on-absolute-pseudo.html | fail | <code>promise_test: Unhandled rejection with value: object "Error: Tried to run in a non-testharness window without a call to set_test_context"</code> |
| /dom/events/element-click.html | fail | <code>button.click is not a function. (In "button.click()", it is undefined)</code> |
| /dom/events/event-disabled-dynamic.html | fail | <code>e.click is not a function. (In "e.click()", it is undefined)</code> |
| /dom/events/event-global-event-targets.html | fail | <code>assert_equals: window.event is set during dispatch expected (object) object "[object Object]" but got (undefined) undefined</code> |
| /dom/events/event-global-extra.window.html | timeout | <code>palim execution timed out</code> |
| /dom/events/event-global-is-still-set-when-coercing-beforeunload-result.html | timeout | <code>palim execution timed out</code> |
| /dom/events/event-global-is-still-set-when-reporting-exception-onerror.html | timeout | <code>palim execution timed out</code> |
| /dom/events/event-global-set-before-handleEvent-lookup.window.html | fail | <code>assert_equals: expected (object) object "[object Object]" but got (undefined) undefined</code> |
| /dom/events/event-global.html | timeout | <code>palim execution timed out</code> |
| /dom/events/event-global.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /dom/events/event-listener-not-fully-active-adopted-node.html | fail | <code>assert_equals: listeners run while the iframe is attached expected 2 but got 1</code> |
| /dom/events/event-listener-not-fully-active-callback.html | fail | <code>assert_equals: the callback does not run once the iframe is removed expected 1 but got 2</code> |
| /dom/events/event-listener-not-fully-active-navigated.html | fail | <code>assert_equals: listeners run before the navigation expected 4 but got 3</code> |
| /dom/events/event-listener-not-fully-active-target.html | fail | <code>assert_equals: listener does not run once the iframe is removed expected 1 but got 2</code> |
| /dom/events/focus-event-document-move.html | fail | <code>Tried to run in a non-testharness window without a call to set_test_context</code> |
| /dom/events/handler-count.html?document | timeout | <code>b'Error: Tried to run in a non-testharness window without a call to set_test_context\n    at create_action (http://web-platform.test:8000/resources/testdriver.js:3244:33)\n    at create_context_action (http://web-platform.test:8000/resources/testdriver.js:3286:36)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/resources/testdriver.js:3680:67)\n    at action_sequence (http://web-platform.test:8000/resources/testdriver.js:1664:73)\n    at send (http://web-platform.test:8000/resources/testdriver-actions.js:99:51)\n    at async &lt;anonymous&gt; (http://web-platform.test:8000/dom/events/handler-count.html?document:19:37)\n    at new Promise (native)\n    at resetAndRecordEvents (http://web-platform.test:8000/dom/events/handler-count.html?document:14:29)\n    at async &lt;anonymous&gt; (http://web-platform.test:8000/dom/events/handler-count.html?document:50:9)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/resources/testharness.js:2869:79)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/resources/testharness.js:738:53)\n    at new Promise (native)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/resources/testharness.js:737:32)'</code> |
| /dom/events/handler-count.html?element | timeout | <code>b'Error: Tried to run in a non-testharness window without a call to set_test_context\n    at create_action (http://web-platform.test:8000/resources/testdriver.js:3244:33)\n    at create_context_action (http://web-platform.test:8000/resources/testdriver.js:3286:36)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/resources/testdriver.js:3680:67)\n    at action_sequence (http://web-platform.test:8000/resources/testdriver.js:1664:73)\n    at send (http://web-platform.test:8000/resources/testdriver-actions.js:99:51)\n    at async &lt;anonymous&gt; (http://web-platform.test:8000/dom/events/handler-count.html?element:19:37)\n    at new Promise (native)\n    at resetAndRecordEvents (http://web-platform.test:8000/dom/events/handler-count.html?element:14:29)\n    at async &lt;anonymous&gt; (http://web-platform.test:8000/dom/events/handler-count.html?element:50:9)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/resources/testharness.js:2869:79)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/resources/testharness.js:738:53)\n    at new Promise (native)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/resources/testharness.js:737:32)'</code> |
| /dom/events/handler-count.html?window | timeout | <code>b'Error: Tried to run in a non-testharness window without a call to set_test_context\n    at create_action (http://web-platform.test:8000/resources/testdriver.js:3244:33)\n    at create_context_action (http://web-platform.test:8000/resources/testdriver.js:3286:36)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/resources/testdriver.js:3680:67)\n    at action_sequence (http://web-platform.test:8000/resources/testdriver.js:1664:73)\n    at send (http://web-platform.test:8000/resources/testdriver-actions.js:99:51)\n    at async &lt;anonymous&gt; (http://web-platform.test:8000/dom/events/handler-count.html?window:19:37)\n    at new Promise (native)\n    at resetAndRecordEvents (http://web-platform.test:8000/dom/events/handler-count.html?window:14:29)\n    at async &lt;anonymous&gt; (http://web-platform.test:8000/dom/events/handler-count.html?window:50:9)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/resources/testharness.js:2869:79)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/resources/testharness.js:738:53)\n    at new Promise (native)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/resources/testharness.js:737:32)'</code> |
| /dom/events/label-default-action.html | fail | <code>button.click is not a function. (In "button.click()", it is undefined)</code> |
| /dom/events/legacy-pre-activation-behavior.window.html | fail | <code>"MouseEvent" is not defined</code> |
| /dom/events/mouse-event-retarget.html | fail | <code>"MouseEvent" is not defined</code> |
| /dom/events/no-focus-events-at-clicking-editable-content-in-link.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: editingHost.blur is not a function. (In "editingHost.blur()", it is undefined)"</code> |
| /dom/events/non-cancelable-when-passive/non-passive-mousewheel-event-listener-on-body.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-mousewheel-event-listener-on-div.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-mousewheel-event-listener-on-document.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-mousewheel-event-listener-on-root.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-mousewheel-event-listener-on-window.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-touchmove-event-listener-on-body.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-touchmove-event-listener-on-div.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-touchmove-event-listener-on-document.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-touchmove-event-listener-on-root.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-touchmove-event-listener-on-window.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-touchstart-event-listener-on-body.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-touchstart-event-listener-on-div.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-touchstart-event-listener-on-document.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-touchstart-event-listener-on-root.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-touchstart-event-listener-on-window.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-wheel-event-listener-on-body.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-wheel-event-listener-on-div.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-wheel-event-listener-on-document.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-wheel-event-listener-on-root.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/non-passive-wheel-event-listener-on-window.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-mousewheel-event-listener-on-body.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-mousewheel-event-listener-on-div.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-mousewheel-event-listener-on-document.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-mousewheel-event-listener-on-root.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-mousewheel-event-listener-on-window.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-touchmove-event-listener-on-body.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-touchmove-event-listener-on-div.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-touchmove-event-listener-on-document.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-touchmove-event-listener-on-root.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-touchmove-event-listener-on-window.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-touchstart-event-listener-on-body.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-touchstart-event-listener-on-div.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-touchstart-event-listener-on-document.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-touchstart-event-listener-on-root.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-touchstart-event-listener-on-window.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-wheel-event-listener-on-body.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-wheel-event-listener-on-div.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-wheel-event-listener-on-document.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-wheel-event-listener-on-root.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/passive-wheel-event-listener-on-window.html | timeout | <code>palim execution timed out</code> |
| /dom/events/non-cancelable-when-passive/synthetic-events-cancelable.html | fail | <code>assert_implements: WheelEvent should be supported undefined</code> |
| /dom/events/passive-by-default-non-node.html | fail | <code>"performance" is not defined</code> |
| /dom/events/passive-by-default.html | fail | <code>assert_equals: defaultPrevented expected false but got true</code> |
| /dom/events/pointer-event-document-move.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /dom/events/preventDefault-during-activation-behavior.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: button.click is not a function. (In "button.click()", it is undefined)"</code> |
| /dom/events/relatedTarget.window.html | fail | <code>"XMLHttpRequest" is not defined</code> |
| /dom/events/scrolling/iframe-chains.html | fail | <code>promise_test: Unhandled rejection with value: object "Error: Tried to run in a non-testharness window without a call to set_test_context"</code> |
| /dom/events/scrolling/input-text-scroll-event-when-using-arrow-keys.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/save-iframe-scroll-offset-when-display-none.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scroll-cross-origin-iframes.html | timeout | <code>b'TypeError: undefined is not a function\n    at async &lt;anonymous&gt; (http://web-platform.test:8000/dom/events/scrolling/scroll-cross-origin-iframes.html:33:12)'</code> |
| /dom/events/scrolling/scroll-event-fired-to-element.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /dom/events/scrolling/scroll-event-fired-to-iframe.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /dom/events/scrolling/scroll-event-not-fired-on-ancestor-style-change.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scroll-events-fired-once-per-frame-across-display-none.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "performance" is not defined"</code> |
| /dom/events/scrolling/scrollIntoView-in-onscroll-to-sticky.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: scroller.getBoundingClientRect is not a function. (In "scroller.getBoundingClientRect()", it is undefined)"</code> |
| /dom/events/scrolling/scrollend-event-fired-after-instant-scroll-in-microtask.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: window.requestAnimationFrame is not a function. (In "window.requestAnimationFrame(() =&gt; {<br>      window.requestAnimationFrame(resolve);<br>    })", it is undefined)"</code> |
| /dom/events/scrolling/scrollend-event-fired-after-layout-clamping.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: window.requestAnimationFrame is not a function. (In "window.requestAnimationFrame(() =&gt; {<br>      window.requestAnimationFrame(resolve);<br>    })", it is undefined)"</code> |
| /dom/events/scrolling/scrollend-event-fired-after-sequence-of-scrolls.tentative.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-after-snap.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-mandatory-snap-point-after-load.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-programmatic-scroll.html?include=root-scrollBy-auto | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-programmatic-scroll.html?include=root-scrollBy-smooth | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-programmatic-scroll.html?include=root-scrollTo-auto | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-programmatic-scroll.html?include=root-scrollTo-smooth | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-programmatic-scroll.html?include=subframe-scrollBy-auto | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-programmatic-scroll.html?include=subframe-scrollBy-smooth | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-programmatic-scroll.html?include=subframe-scrollTo-auto | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-programmatic-scroll.html?include=subframe-scrollTo-smooth | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scroll-attr-change.html?include=root-scrollLeft-auto | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scroll-attr-change.html?include=root-scrollLeft-smooth | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scroll-attr-change.html?include=root-scrollTop-auto | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scroll-attr-change.html?include=root-scrollTop-smooth | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scroll-attr-change.html?include=subframe-scrollLeft-auto | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scroll-attr-change.html?include=subframe-scrollLeft-smooth | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scroll-attr-change.html?include=subframe-scrollTop-auto | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scroll-attr-change.html?include=subframe-scrollTop-smooth | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scrollIntoView.html?include=nested-scrollIntoView | error | <code>TypeError: Cannot convert undefined to object</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scrollIntoView.html?include=root-inline-end-block-end-behavior-auto | error | <code>TypeError: Cannot convert undefined to object</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scrollIntoView.html?include=root-inline-start-block-start-behavior-smooth | error | <code>TypeError: Cannot convert undefined to object</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scrollIntoView.html?include=subframe-inline-end-block-end-behavior-auto | error | <code>TypeError: Cannot convert undefined to object</code> |
| /dom/events/scrolling/scrollend-event-fired-for-scrollIntoView.html?include=subframe-inline-start-block-start-behavior-smooth | error | <code>TypeError: Cannot convert undefined to object</code> |
| /dom/events/scrolling/scrollend-event-fired-to-document.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-to-element-with-overscroll-behavior.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fired-to-window.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fires-for-repeat-key-ending-after-scroll-container-end-is-reached.html | timeout |  |
| /dom/events/scrolling/scrollend-event-fires-on-visual-viewport.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-fires-to-iframe-window.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-for-user-scroll.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-handler-content-attributes.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-not-fired-after-removing-scroller.tentative.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-event-not-fired-on-no-scroll.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-fires-to-text-input.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/scrollend-with-snap-on-fractional-offset.html | fail | <code>assert_equals: test precondition: scroller is not scrolled. expected (number) 0 but got (undefined) undefined</code> |
| /dom/events/scrolling/visibility-hidden-scrolls.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: window.requestAnimationFrame is not a function. (In "window.requestAnimationFrame(() =&gt; {<br>      window.requestAnimationFrame(resolve);<br>    })", it is undefined)"</code> |
| /dom/events/scrolling/wheel-event-composed.html | fail | <code>promise_test: Unhandled rejection with value: object "Error: Tried to run in a non-testharness window without a call to set_test_context"</code> |
| /dom/events/scrolling/wheel-event-no-scroll-after-prevent-default.html | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/wheel-event-transactions-basic.html?include=scroll-over-scrollable-child | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/wheel-event-transactions-basic.html?include=target-basic | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/wheel-event-transactions-basic.html?include=transaction-not-bound-to-scroll-frame | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/wheel-event-transactions-multiple-action-chains.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: document.body.animate is not a function. (In "document.body.animate({ opacity: [ 0, 1 ] }, {duration: 1 })", it is undefined)"</code> |
| /dom/events/scrolling/wheel-event-transactions-target-display-change.html?include=contents | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/wheel-event-transactions-target-display-change.html?include=none | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/wheel-event-transactions-target-elements.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: document.body.animate is not a function. (In "document.body.animate({ opacity: [ 0, 1 ] }, {duration: 1 })", it is undefined)"</code> |
| /dom/events/scrolling/wheel-event-transactions-target-move.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: document.body.animate is not a function. (In "document.body.animate({ opacity: [ 0, 1 ] }, {duration: 1 })", it is undefined)"</code> |
| /dom/events/scrolling/wheel-event-transactions-target-removal.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: document.body.animate is not a function. (In "document.body.animate({ opacity: [ 0, 1 ] }, {duration: 1 })", it is undefined)"</code> |
| /dom/events/scrolling/wheel-event-transactions-target-resize.html?include=passive-false | timeout | <code>palim execution timed out</code> |
| /dom/events/scrolling/wheel-event-transactions-target-resize.html?include=passive-true | timeout | <code>palim execution timed out</code> |
| /dom/events/shadow-relatedTarget.html | fail | <code>root.getElementById("shadowInput").focus is not a function. (In "root.getElementById("shadowInput").focus()", it is undefined)</code> |
| /dom/events/webkit-animation-end-event.html | error | <code>TypeError: Cannot convert undefined to object</code> |
| /dom/events/webkit-animation-iteration-event.html | error | <code>TypeError: Cannot convert undefined to object</code> |
| /dom/events/webkit-animation-start-event.html | error | <code>TypeError: Cannot convert undefined to object</code> |
| /dom/events/webkit-transition-end-event.html | error | <code>TypeError: Cannot convert undefined to object</code> |
| /dom/events/window-composed-path.html | error | <code>TypeError: e.composedPath is not a function. (In "e.composedPath()", it is undefined)</code> |
| /dom/events/window-event-restored-after-throwing-onerror.html | fail | <code>assert_equals: window.event is the outer event before the nested dispatch expected (object) object "[object Object]" but got (undefined) undefined</code> |
| /dom/nodes/Comment-constructor.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/DOMImplementation-createDocument-no-browsing-context.html | fail | <code>assert_equals: onafterprint should be null because there is no window expected (object) null but got (string) "1 + 2"</code> |
| /dom/nodes/Document-URL.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/Document-adoptNode-DocumentFragment-with-host.window.html | fail | <code>assert_throws_dom: function "() =&gt; target.adoptNode(root)" did not throw</code> |
| /dom/nodes/Document-base-url-not-live.window.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/Document-characterSet-normalization-1.html | timeout |  |
| /dom/nodes/Document-characterSet-normalization-2.html | timeout |  |
| /dom/nodes/Document-cloneNode-about-base-url-relative.window.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/Document-cloneNode-about-base-url.window.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/Document-cloneNode-base-url.window.html | fail | <code>assert_equals: source expected "http://web-platform.test:8000/dom/nodes/sub/" but got "about:blank"</code> |
| /dom/nodes/Document-cloneNode-srcdoc-base-url.window.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/Document-contentType/contentType/contenttype_bmp.html | fail | <code>assert_equals: expected "image/bmp" but got "text/html"</code> |
| /dom/nodes/Document-contentType/contentType/contenttype_css.html | fail | <code>assert_equals: expected "text/css" but got "text/html"</code> |
| /dom/nodes/Document-contentType/contentType/contenttype_datauri_02.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/Document-contentType/contentType/contenttype_gif.html | fail | <code>assert_equals: expected "image/gif" but got "text/html"</code> |
| /dom/nodes/Document-contentType/contentType/contenttype_javascripturi.html | fail | <code>assert_equals: expected "text/html" but got ""</code> |
| /dom/nodes/Document-contentType/contentType/contenttype_jpg.html | fail | <code>assert_equals: expected "image/jpeg" but got "text/html"</code> |
| /dom/nodes/Document-contentType/contentType/contenttype_mimeheader_01.html | fail | <code>assert_equals: expected "text/xml" but got "text/html"</code> |
| /dom/nodes/Document-contentType/contentType/contenttype_png.html | fail | <code>assert_equals: expected "image/png" but got "text/html"</code> |
| /dom/nodes/Document-contentType/contentType/contenttype_txt.html | fail | <code>assert_equals: expected "text/plain" but got "text/html"</code> |
| /dom/nodes/Document-contentType/contentType/contenttype_xml.html | fail | <code>assert_equals: expected "application/xml" but got "text/html"</code> |
| /dom/nodes/Document-contentType/contentType/xhr_responseType_document.html | fail | <code>"XMLHttpRequest" is not defined</code> |
| /dom/nodes/Document-createCDATASection-xhtml.xhtml | error | <code>ReferenceError: "CDATASection" is not defined</code> |
| /dom/nodes/Document-createElement-namespace.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/Document-createElement.html | fail | <code>assert_equals: XML document didn't load expected "Dummy XML document" but got "Dummy XML document\n"</code> |
| /dom/nodes/Document-createElementNS.html | fail | <code>assert_equals: expected "Dummy XML document" but got "Dummy XML document\n"</code> |
| /dom/nodes/Document-createEvent.https.html | error | <code>The event interface "BeforeUnloadEvent" is not supported</code> |
| /dom/nodes/DocumentFragment-constructor.html | fail | <code>assert_equals: expected Document node with 2 children but got Document node with 0 children</code> |
| /dom/nodes/Element-classlist.html | fail | <code>The childList option must be true</code> |
| /dom/nodes/Element-closest.html | fail | <code>assert_equals: :invalid expected "test2" but got ""</code> |
| /dom/nodes/Element-getElementsByTagName-change-document-HTMLNess.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/Element-matches-namespaced-elements.html | fail | <code>document.createElementNS("", "element")[method] is not a function. (In "document.createElementNS("", "element")[method]("element")", it is undefined)</code> |
| /dom/nodes/Element-matches.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/Element-webkitMatchesSelector.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/MutationObserver-attributes.html | fail | <code>The childList option must be true</code> |
| /dom/nodes/MutationObserver-callback-arguments.html | fail | <code>The childList option must be true</code> |
| /dom/nodes/MutationObserver-callback-order.window.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: The childList option must be true"</code> |
| /dom/nodes/MutationObserver-callback-tricky.html | fail | <code>The childList option must be true</code> |
| /dom/nodes/MutationObserver-characterData.html | fail | <code>The childList option must be true</code> |
| /dom/nodes/MutationObserver-childList.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/MutationObserver-cross-realm-callback-report-exception.html | timeout | <code>b'TypeError: Cannot convert undefined to object\n    at http://web-platform.test:8000/dom/nodes/MutationObserver-cross-realm-callback-report-exception.html:6:21'</code> |
| /dom/nodes/MutationObserver-disconnect.html | fail | <code>The childList option must be true</code> |
| /dom/nodes/MutationObserver-document.html | fail | <code>assert_unreached: document observer did not trigger Reached unreachable code</code> |
| /dom/nodes/MutationObserver-inner-outer.html | fail | <code>assert_array_equals: addedNodes didn't match lengths differ, expected array [Text node "new text"] length 1, got object "[object NodeList]" length 0</code> |
| /dom/nodes/MutationObserver-overlapping-registrations.html | fail | <code>The childList option must be true</code> |
| /dom/nodes/MutationObserver-sanity.html | fail | <code>The childList option must be true</code> |
| /dom/nodes/MutationObserver-takeRecords.html | fail | <code>assert_equals: mutation records must match expected 5 but got 1</code> |
| /dom/nodes/MutationObserver-textContent.html | fail | <code>assert_equals: Should have one record expected 1 but got 2</code> |
| /dom/nodes/MutationObserver-transient-registered-observers.window.html | fail | <code>assert_array_equals: expected property 0 to be "childList parent -child" but got "childList parent -child undefined" (expected array ["childList parent -child", "childList child +added"] got ["childList parent -child undefined", "childList child +added undefined"])</code> |
| /dom/nodes/MutationObserver-xml-parser.xhtml | fail | <code>assert_equals: mutation records must match expected 6 but got 0</code> |
| /dom/nodes/Node-appendChild-cereactions-vs-script.window.html | fail | <code>Super class [Function HTMLScriptElement] is not a constructor</code> |
| /dom/nodes/Node-appendChild.html | fail | <code>Cannot convert undefined to object</code> |
| /dom/nodes/Node-cloneNode-document-allow-declarative-shadow-roots.window.html | fail | <code>doc.write is not a function. (In "doc.write('&lt;div&gt;&lt;template shadowrootmode=open&gt;test&lt;/template&gt;&lt;/div&gt;')", it is undefined)</code> |
| /dom/nodes/Node-insertBefore.html | fail | <code>assert_throws_js: function "function() { document.body.insertBefore(document.createTextNode("child")) }" did not throw</code> |
| /dom/nodes/Node-isEqualNode-xhtml.xhtml | timeout | <code>palim execution timed out</code> |
| /dom/nodes/Node-parentNode.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/Node-removeChild.html | fail | <code>Cannot convert undefined to object</code> |
| /dom/nodes/NodeList-static-length-getter-tampered-1.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/NodeList-static-length-getter-tampered-2.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/NodeList-static-length-getter-tampered-3.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/NodeList-static-length-getter-tampered-indexOf-1.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/NodeList-static-length-getter-tampered-indexOf-2.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/NodeList-static-length-getter-tampered-indexOf-3.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/ParentNode-properties.html | fail | <code>Cannot convert undefined to object</code> |
| /dom/nodes/ParentNode-querySelector-All-xht.xht | timeout | <code>Test timed out</code> |
| /dom/nodes/ParentNode-querySelector-All.html | timeout | <code>Test timed out</code> |
| /dom/nodes/ParentNode-querySelector-host-pseudo-class.html | fail | <code>assert_equals: querySelector with :host pseudo-class should find the element expected Element node &lt;article&gt;&lt;/article&gt; but got null</code> |
| /dom/nodes/ParentNode-replaceChildren.html | timeout | <code>b'at &lt;anonymous&gt; (http://web-platform.test:8000/dom/nodes/ParentNode-replaceChildren.html:172:42)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/dom/nodes/ParentNode-replaceChildren.html:210:42)'</code> |
| /dom/nodes/ProcessingInstruction-escapes-1.xhtml | fail | <code>Cannot convert undefined to object</code> |
| /dom/nodes/Text-constructor.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/adoption.window.html | fail | <code>assert_throws_dom: function "() =&gt; document.adoptNode(df)" did not throw</code> |
| /dom/nodes/create-element-realm-after-adoption.html | fail | <code>customElements.get is not a function. (In "customElements.get("x-baz")", it is undefined)</code> |
| /dom/nodes/getElementById-namespaced-id.html | fail | <code>assert_equals: expected (object) Element node &lt;form id="owner" id="unrelated"&gt;&lt;/form&gt; but got (undefined) undefined</code> |
| /dom/nodes/getElementsByClassName-31.htm | timeout | <code>palim execution timed out</code> |
| /dom/nodes/insertion-removing-steps/Node-append-meta-referrer-and-script-from-fragment.html | error | <code>ReferenceError: "fetch" is not defined</code> |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-and-custom-from-fragment.html | fail | <code>assert_true: expected true got false</code> |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-and-default-style-meta-from-fragment.html | fail | <code>"getComputedStyle" is not defined</code> |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-and-style.html | fail | <code>assert_array_equals: expected property 0 to be "sheet" but got null (expected array ["sheet", 2] got [null, undefined])</code> |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-in-script.html | fail | <code>assert_array_equals: lengths differ, expected array ["s1", "s2", "s2ran"] length 3, got ["s1", "s2", "s2ran", "s2", "s2ran"] length 5</code> |
| /dom/nodes/insertion-removing-steps/Node-appendChild-text-and-script-in-style.html | error | <code>TypeError: Cannot convert undefined to object</code> |
| /dom/nodes/insertion-removing-steps/blur-event.window.html | fail | <code>input.focus is not a function. (In "input.focus()", it is undefined)</code> |
| /dom/nodes/insertion-removing-steps/change-event.window.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: input.focus is not a function. (In "input.focus()", it is undefined)"</code> |
| /dom/nodes/insertion-removing-steps/frame-post-connection-steps.html | fail | <code>assert_equals: The frame window is created in post-connection order expected (object) null but got (undefined) undefined</code> |
| /dom/nodes/insertion-removing-steps/insertion-removing-steps-iframe.window.html | fail | <code>assert_true: iframe1 loaded expected true got false</code> |
| /dom/nodes/insertion-removing-steps/script-does-not-run-on-child-removal.window.html | fail | <code>assert_false: Appending script with invalid type does not trigger execution expected false got true</code> |
| /dom/nodes/live-collections-batched-mutations.window.html | fail | <code>assert_equals: expected (object) Element node &lt;span&gt;&lt;/span&gt; but got (undefined) undefined</code> |
| /dom/nodes/moveBefore/Node-moveBefore.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "requestAnimationFrame" is not defined"</code> |
| /dom/nodes/moveBefore/child-style-preserve.html | fail | <code>item.getBoundingClientRect is not a function. (In "item.getBoundingClientRect()", it is undefined)</code> |
| /dom/nodes/moveBefore/continue-css-animation-left.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/moveBefore/continue-css-animation-transform.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/moveBefore/continue-css-transition-left-pseudo.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: item.getBoundingClientRect is not a function. (In "item.getBoundingClientRect()", it is undefined)"</code> |
| /dom/nodes/moveBefore/continue-css-transition-left.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: item.getBoundingClientRect is not a function. (In "item.getBoundingClientRect()", it is undefined)"</code> |
| /dom/nodes/moveBefore/continue-css-transition-transform-pseudo.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: item.getBoundingClientRect is not a function. (In "item.getBoundingClientRect()", it is undefined)"</code> |
| /dom/nodes/moveBefore/continue-css-transition-transform.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: item.getBoundingClientRect is not a function. (In "item.getBoundingClientRect()", it is undefined)"</code> |
| /dom/nodes/moveBefore/css-animation-commit-styles.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/moveBefore/css-transition-cross-document.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/moveBefore/css-transition-cross-shadow.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: item.getBoundingClientRect is not a function. (In "item.getBoundingClientRect()", it is undefined)"</code> |
| /dom/nodes/moveBefore/css-transition-to-disconnected-document.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: item.getBoundingClientRect is not a function. (In "item.getBoundingClientRect()", it is undefined)"</code> |
| /dom/nodes/moveBefore/css-transition-trigger.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: item.getBoundingClientRect is not a function. (In "item.getBoundingClientRect()", it is undefined)"</code> |
| /dom/nodes/moveBefore/custom-element-move-reactions.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: Cannot convert null to object"</code> |
| /dom/nodes/moveBefore/fieldset-child-blur-event.html | fail | <code>victim.focus is not a function. (In "victim.focus()", it is undefined)</code> |
| /dom/nodes/moveBefore/fieldset-child-date-input-blur-event.html | fail | <code>victim.focus is not a function. (In "victim.focus()", it is undefined)</code> |
| /dom/nodes/moveBefore/fire-focusin-focusout.html | fail | <code>button.focus is not a function. (In "button.focus()", it is undefined)</code> |
| /dom/nodes/moveBefore/focus-preserve.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: focusedElement.focus is not a function. (In "focusedElement.focus()", it is undefined)"</code> |
| /dom/nodes/moveBefore/focus-within.html | fail | <code>button.focus is not a function. (In "button.focus()", it is undefined)</code> |
| /dom/nodes/moveBefore/fullscreen-preserve.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /dom/nodes/moveBefore/hover-style-update.html | fail | <code>promise_test: Unhandled rejection with value: object "Error: Tried to run in a non-testharness window without a call to set_test_context"</code> |
| /dom/nodes/moveBefore/iframe-document-preserve.window.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/moveBefore/modal-dialog.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: dialog.showModal is not a function. (In "dialog.showModal()", it is undefined)"</code> |
| /dom/nodes/moveBefore/moveBefore-child-list-selector-invalidation.html | fail | <code>"getComputedStyle" is not defined</code> |
| /dom/nodes/moveBefore/moveBefore-from-light-to-shadow.html | fail | <code>span.getBoundingClientRect is not a function. (In "span.getBoundingClientRect()", it is undefined)</code> |
| /dom/nodes/moveBefore/moveBefore-into-display-none.html | fail | <code>span.getBoundingClientRect is not a function. (In "span.getBoundingClientRect()", it is undefined)</code> |
| /dom/nodes/moveBefore/moveBefore-optgroup.html | fail | <code>Cannot convert undefined to object</code> |
| /dom/nodes/moveBefore/moveBefore-selector-matching.html | fail | <code>"getComputedStyle" is not defined</code> |
| /dom/nodes/moveBefore/moveBefore-shadow-inside.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "requestAnimationFrame" is not defined"</code> |
| /dom/nodes/moveBefore/moveBefore-size-query.html | fail | <code>"getComputedStyle" is not defined</code> |
| /dom/nodes/moveBefore/nonce.html | fail | <code>assert_equals: expected "" but got "8IBTHwOdqNKAWeKl7plt8g=="</code> |
| /dom/nodes/moveBefore/pointer-events.html | fail | <code>promise_test: Unhandled rejection with value: object "Error: Tried to run in a non-testharness window without a call to set_test_context"</code> |
| /dom/nodes/moveBefore/popover-preserve.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: popover.showPopover is not a function. (In "popover.showPopover()", it is undefined)"</code> |
| /dom/nodes/moveBefore/preserve-render-blocking-script.html | error | <code>ReferenceError: "requestAnimationFrame" is not defined</code> |
| /dom/nodes/moveBefore/preserve-render-blocking-style.html | error | <code>ReferenceError: "requestAnimationFrame" is not defined</code> |
| /dom/nodes/moveBefore/relevant-mutations.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/moveBefore/role-updates-after-move.html | fail | <code>promise_test: Unhandled rejection with value: object "Error: Tried to run in a non-testharness window without a call to set_test_context"</code> |
| /dom/nodes/moveBefore/select-option-optgroup.html | fail | <code>assert_true: A is selected by default expected true got undefined</code> |
| /dom/nodes/moveBefore/selection-preserve.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "getSelection" is not defined"</code> |
| /dom/nodes/moveBefore/style-applies.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "getComputedStyle" is not defined"</code> |
| /dom/nodes/moveBefore/stylesheet-cascade-order.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/moveBefore/stylesheet-no-refetch.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/name-validation.html | timeout |  |
| /dom/nodes/namespaced-attribute-mutations.html | fail | <code>assert_equals: expected 1 but got 0</code> |
| /dom/nodes/node-creation-realm.html | fail | <code>Right-hand side of "instanceof" (undefined) is not an object</code> |
| /dom/nodes/node-realm-mixed-across-adoption.html | fail | <code>window.customElements.get is not a function. (In "window.customElements.get("x-mixed")", it is undefined)</code> |
| /dom/nodes/post-connection-steps-shadow-tree.html | fail | <code>assert_equals: script runs when its shadow-including tree becomes connected expected 1 but got 0</code> |
| /dom/nodes/processing-instruction-attributes.html | fail | <code>pi.getAttribute is not a function. (In "pi.getAttribute("a")", it is undefined)</code> |
| /dom/nodes/query-target-in-load-event.html | timeout | <code>palim execution timed out</code> |
| /dom/nodes/remove-and-adopt-thcrash.html | fail | <code>window.open is not a function. (In "window.open()", it is undefined)</code> |
| /dom/nodes/remove-unscopable.html | fail | <code>Cannot convert undefined to object</code> |
| /dom/ranges/Range-cloneContents-around-shadow.tentative.html | fail | <code>"getSelection" is not defined</code> |
| /dom/ranges/Range-cloneContents.html | timeout |  |
| /dom/ranges/Range-compareBoundaryPoints.html | timeout |  |
| /dom/ranges/Range-comparePoint.html | timeout |  |
| /dom/ranges/Range-deleteContents-around-shadow.tentative.html | fail | <code>"getSelection" is not defined</code> |
| /dom/ranges/Range-deleteContents.html | timeout |  |
| /dom/ranges/Range-expand-shadow.tentative.html | fail | <code>range.expand is not a function. (In "range.expand(unit)", it is undefined)</code> |
| /dom/ranges/Range-extractContents-around-shadow.tentative.html | fail | <code>"getSelection" is not defined</code> |
| /dom/ranges/Range-extractContents-dynamic-end.html | fail | <code>Cannot convert undefined to object</code> |
| /dom/ranges/Range-extractContents.html | timeout |  |
| /dom/ranges/Range-in-shadow-after-the-shadow-removed.html?mode=closed | error | <code>TypeError: Cannot convert null to object</code> |
| /dom/ranges/Range-in-shadow-after-the-shadow-removed.html?mode=open | error | <code>TypeError: Cannot convert null to object</code> |
| /dom/ranges/Range-insertNode.html | timeout |  |
| /dom/ranges/Range-isPointInRange.html | timeout |  |
| /dom/ranges/Range-mutations-appendChild.html | fail | <code>"getSelection" is not defined</code> |
| /dom/ranges/Range-mutations-appendData.html | fail | <code>originalData.substr is not a function. (In "originalData.substr(0, offset)", it is undefined)</code> |
| /dom/ranges/Range-mutations-dataChange.html | timeout | <code>originalData.substr is not a function. (In "originalData.substr(0, offset)", it is undefined)</code> |
| /dom/ranges/Range-mutations-deleteData.html | fail | <code>"getSelection" is not defined</code> |
| /dom/ranges/Range-mutations-insertBefore.html | fail | <code>"getSelection" is not defined</code> |
| /dom/ranges/Range-mutations-insertData.html | fail | <code>"getSelection" is not defined</code> |
| /dom/ranges/Range-mutations-removeChild.html | fail | <code>"getSelection" is not defined</code> |
| /dom/ranges/Range-mutations-replaceChild.html | fail | <code>"getSelection" is not defined</code> |
| /dom/ranges/Range-mutations-replaceData.html | fail | <code>"getSelection" is not defined</code> |
| /dom/ranges/Range-mutations-splitText.html | fail | <code>"getSelection" is not defined</code> |
| /dom/ranges/Range-set.html | timeout |  |
| /dom/ranges/Range-surroundContents.html | timeout |  |
| /dom/ranges/tentative/OpaqueRange-auto-disconnect.html | fail | <code>el.createValueRange is not a function. (In "el.createValueRange(1, 4)", it is undefined)</code> |
| /dom/ranges/tentative/OpaqueRange-basic.html | fail | <code>textarea.createValueRange is not a function. (In "textarea.createValueRange(0, 5)", it is undefined)</code> |
| /dom/ranges/tentative/OpaqueRange-disconnect.html | fail | <code>textarea.createValueRange is not a function. (In "textarea.createValueRange(1, 4)", it is undefined)</code> |
| /dom/ranges/tentative/OpaqueRange-display-none.html | fail | <code>element.createValueRange is not a function. (In "element.createValueRange(1, 4)", it is undefined)</code> |
| /dom/ranges/tentative/OpaqueRange-geometry-basic.html | fail | <code>element.focus is not a function. (In "element.focus()", it is undefined)</code> |
| /dom/ranges/tentative/OpaqueRange-geometry-complexity-and-visibility.html | fail | <code>element.focus is not a function. (In "element.focus()", it is undefined)</code> |
| /dom/ranges/tentative/OpaqueRange-geometry-multiline.html | fail | <code>el.createValueRange is not a function. (In "el.createValueRange(0, 5)", it is undefined)</code> |
| /dom/ranges/tentative/OpaqueRange-geometry-mutations.html | fail | <code>element.focus is not a function. (In "element.focus()", it is undefined)</code> |
| /dom/ranges/tentative/OpaqueRange-highlight.html | fail | <code>"CSS" is not defined</code> |
| /dom/ranges/tentative/OpaqueRange-highlightsFromPoint.html | fail | <code>"CSS" is not defined</code> |
| /dom/ranges/tentative/OpaqueRange-interactive-basic.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.focus is not a function. (In "element.focus()", it is undefined)"</code> |
| /dom/ranges/tentative/OpaqueRange-interactive-overlap-and-selection.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.focus is not a function. (In "element.focus()", it is undefined)"</code> |
| /dom/ranges/tentative/OpaqueRange-offset.html | fail | <code>element.createValueRange is not a function. (In "element.createValueRange(start, end)", it is undefined)</code> |
| /dom/ranges/tentative/OpaqueRange-programmatic-updates.html | fail | <code>element.focus is not a function. (In "element.focus()", it is undefined)</code> |
| /dom/ranges/tentative/OpaqueRange-range-updates.html | fail | <code>textarea.createValueRange is not a function. (In "textarea.createValueRange(0, 5)", it is undefined)</code> |
| /dom/ranges/tentative/OpaqueRange-supported-elements.html | fail | <code>element.createValueRange is not a function. (In "element.createValueRange(0, value.length)", it is undefined)</code> |
| /dom/ranges/tentative/OpaqueRange-unsupported-elements.html | fail | <code>assert_throws_dom: createValueRange should throw NotSupportedError for &lt;input&gt; function "() =&gt; {<br>      input.createValueRange(0, 0);<br>    }" threw object "TypeError: input.createValueRange is not a function. (In "input.createValueRange(0, 0)", it is undefined)" that is not a DOMException NotSupportedError: property "code" is equal to undefined, expected 9</code> |
| /dom/ranges/tentative/OpaqueRange-update-event-order.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.focus is not a function. (In "element.focus()", it is undefined)"</code> |
| /dom/ranges/tentative/OpaqueRange-validation.html | fail | <code>assert_throws_dom: function "() =&gt; textarea.createValueRange(10, 15)" threw object "TypeError: textarea.createValueRange is not a function. (In "textarea.createValueRange(10, 15)", it is undefined)" that is not a DOMException IndexSizeError: property "code" is equal to undefined, expected 1</code> |
| /domparsing/DOMParser-parseFromString-stylesheets.html | fail | <code>Cannot convert undefined to object</code> |
| /domparsing/DOMParser-parseFromString-url-base-about.window.html | timeout | <code>palim execution timed out</code> |
| /domparsing/DOMParser-parseFromString-url-base-pushstate.html | error | <code>ReferenceError: "history" is not defined</code> |
| /domparsing/DOMParser-parseFromString-url-base.html | timeout | <code>palim execution timed out</code> |
| /domparsing/DOMParser-parseFromString-url-moretests.html | timeout | <code>palim execution timed out</code> |
| /domparsing/DOMParser-parseFromString-url-pushstate.html | error | <code>ReferenceError: "history" is not defined</code> |
| /domparsing/DOMParser-parseFromString-url.html | timeout | <code>palim execution timed out</code> |
| /domparsing/DOMParser-parseFromString-xml.html | fail | <code>assert_false: Should not be XMLDocument expected false got true</code> |
| /domparsing/XMLSerializer-serializeToString.html | fail | <code>assert_equals: expected "&lt;r xmlns:xx=\"uri\" xmlns:ns1=\"uri2\" ns1:name=\"value\"/&gt;" but got "&lt;r xmlns:xx=\"uri\" xmlns:p=\"uri2\" p:name=\"value\"/&gt;"</code> |
| /domparsing/html-insertion-methods-html-element.html | timeout | <code>palim execution timed out</code> |
| /domparsing/innerhtml-05.xhtml | timeout | <code>palim execution timed out</code> |
| /domparsing/outerhtml-03.html | timeout | <code>palim execution timed out</code> |
| /domparsing/positional-methods-with-parser-options.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /domparsing/positional-methods-with-trusted-types-no-createParserOptions.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /domparsing/positional-methods-with-trusted-types.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /domparsing/stream-html-reentrancy.html | fail | <code>assert_array_equals: lengths differ, expected array ["connected"] length 1, got [] length 0</code> |
| /domparsing/tentative/all-stream-methods-with-trusted-types-no-policy.html | fail | <code>assert_throws_js: function "() =&gt; d[method]()" did not throw</code> |
| /domparsing/tentative/stream-append-html-unsafe.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "Response" is not defined"</code> |
| /domparsing/tentative/stream-append-html.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "Response" is not defined"</code> |
| /domparsing/tentative/stream-fragment-context.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: Cannot convert undefined to object"</code> |
| /domparsing/tentative/stream-html-abort-unblocks-rendering.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "performance" is not defined"</code> |
| /domparsing/tentative/stream-html-custom-element-sanitizer.html | error | <code>TypeError: [Function CustomElementRegistry] is not a constructor</code> |
| /domparsing/tentative/stream-html-custom-element.html | fail | <code>assert_array_equals: streamHTML must invoke connectedCallback when chunk is parsed on write lengths differ, expected array ["constructed", "connected"] length 2, got [] length 0</code> |
| /domparsing/tentative/stream-html-defer-async-script.html | fail | <code>assert_array_equals: lengths differ, expected array ["immediate"] length 1, got ["defer", "immediate"] length 2</code> |
| /domparsing/tentative/stream-html-element.html | timeout | <code>palim execution timed out</code> |
| /domparsing/tentative/stream-html-parser-blocking-script.html | timeout | <code>assert_array_equals: lengths differ, expected array ["slow", "inline"] length 2, got ["inline"] length 1</code> |
| /domparsing/tentative/stream-html-sanitizer.html | fail | <code>assert_throws_js: function "_ =&gt; {<br>          placeholder[method]({sanitizer: {elements: ["div"], removeElements: ["div"]}});<br>        }" threw object "Error: Invalid SanitizerConfig" ("Error") expected instance of function "function TypeError() { [native code] }" ("TypeError")</code> |
| /domparsing/tentative/stream-html-unsafe.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "Response" is not defined"</code> |
| /domparsing/tentative/stream-html-with-declarative-shadow-root.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: doc.open is not a function. (In "doc.open()", it is undefined)"</code> |
| /domparsing/tentative/stream-html-with-trusted-types-adopt.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /domparsing/tentative/stream-html-with-trusted-types-createParserOptions-order.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /domparsing/tentative/stream-html-with-trusted-types-error-in-policy.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /domparsing/tentative/stream-html-with-trusted-types-from-non-tt.html | fail | <code>assert_throws_js: function "() =&gt; adoptedDiv[method]()" did not throw</code> |
| /domparsing/tentative/stream-html-with-trusted-types-no-createParserOptions.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /domparsing/tentative/stream-html-with-trusted-types-no-policy.html | fail | <code>assert_throws_js: function "() =&gt; d[method]()" did not throw</code> |
| /domparsing/tentative/stream-html-with-trusted-types-pass-trusted.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /domparsing/tentative/stream-html-with-trusted-types-runScripts-cannot-be-turned-on.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /domparsing/tentative/stream-html-with-trusted-types-runScripts-off.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /domparsing/tentative/stream-html-with-trusted-types-sanitizer.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /domparsing/tentative/stream-html.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "Response" is not defined"</code> |
| /domparsing/tentative/stream-sanitizer-customized-builtins.html | error | <code>TypeError: Super class [Function HTMLButtonElement] is not a constructor</code> |
| /domparsing/tentative/stream-sanitizer-img-ctor.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "Image" is not defined"</code> |
| /domparsing/tentative/stream-sanitizer-resource-fetch.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "fetch" is not defined"</code> |
| /domparsing/tentative/stream-tokenizer-context.html | fail | <code>assert_equals: expected (string) "&lt;b&gt;Hello &lt;world&gt; &amp; test&lt;/b&gt;" but got (undefined) undefined</code> |
| /domparsing/tentative/unclosed-script-already-started.html | fail | <code>assert_false: createContextualFragment: must not run on insertion expected false got true</code> |
| /domparsing/unsafe-and-trusted-types-external-scripts-async.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /html/dom/documents/dom-tree-accessors/Document.currentScript.html | timeout | <code>b'SyntaxError: Unexpected token\nhttp://web-platform.test:8000/html/dom/documents/dom-tree-accessors/Document.currentScript.html:1:2\n{\n ^\nReferenceError: "undefinedfn" is not defined\n    at http://web-platform.test:8000/html/dom/documents/dom-tree-accessors/Document.currentScript.html:1:1\n    at steps (native)\n    at http://web-platform.test:8000/html/dom/documents/dom-tree-accessors/Document.currentScript.html:18:29\nReferenceError: "XMLHttpRequest" is not defined\n    at http://web-platform.test:8000/html/dom/documents/dom-tree-accessors/Document.currentScript.html:2:21\nTypeError: undefined is not a function\n    at http://web-platform.test:8000/html/dom/documents/dom-tree-accessors/Document.currentScript.html:2:102'</code> |
| /html/dom/documents/dom-tree-accessors/nameditem-no-shadowing.tentative.html | fail | <code>assert_equals: expected (function) function "function Document() { [native code] }" but got (object) Element node &lt;img name="constructor"&gt;&lt;/img&gt;</code> |
| /html/dom/documents/dom-tree-accessors/nameditem-setattribute-attr-mutation.html | fail | <code>[object Object] is not iterable</code> |
| /html/dom/elements/elements-in-the-dom/click-in-progress-flag.html | fail | <code>div.click is not a function. (In "div.click()", it is undefined)</code> |
| /html/dom/elements/global-attributes/cdata-dir_auto.html | timeout | <code>palim execution timed out</code> |
| /html/dom/elements/global-attributes/custom-attrs.html | fail | <code>assert_equals: expected 3 but got 2</code> |
| /html/dom/elements/global-attributes/dataset.html | fail | <code>assert_true: expected true got false</code> |
| /html/dom/elements/global-attributes/dir-assorted.window.html | fail | <code>assert_true: is RTL before change expected true got false</code> |
| /html/dom/elements/global-attributes/dir-auto-div-append-child.html | fail | <code>"getComputedStyle" is not defined</code> |
| /html/dom/elements/global-attributes/dir-auto-dynamic-changes.window.html | fail | <code>"getComputedStyle" is not defined</code> |
| /html/dom/elements/global-attributes/dir-auto-form-associated.window.html | fail | <code>assert_true: expected true got false</code> |
| /html/dom/elements/global-attributes/dir-bdi-script.html | fail | <code>"getComputedStyle" is not defined</code> |
| /html/dom/elements/global-attributes/dir-not-changed-text-input-typing.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /html/dom/elements/global-attributes/dir-slots-directionality.html | fail | <code>"getComputedStyle" is not defined</code> |
| /html/dom/elements/global-attributes/id-attribute.html | fail | <code>document.defaultView.getComputedStyle is not a function. (In "document.defaultView.getComputedStyle(document.getElementById("abcd"))", it is undefined)</code> |
| /html/dom/elements/global-attributes/id-name-specialcase.html | fail | <code>assert_equals: expected (string) "123" but got (undefined) undefined</code> |
| /html/dom/elements/global-attributes/lang-attribute-shadow.window.html | fail | <code>assert_true: element matches expected language en-AU expected true got false</code> |
| /html/dom/elements/global-attributes/lang-attribute.window.html | fail | <code>assert_true: child matches en-CA expected true got false</code> |
| /html/dom/elements/global-attributes/mapped-attribute-adopt-001.html | fail | <code>"getComputedStyle" is not defined</code> |
| /html/dom/elements/global-attributes/the-lang-attribute-001.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /html/dom/elements/global-attributes/the-lang-attribute-002.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /html/dom/elements/global-attributes/the-lang-attribute-003.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /html/dom/elements/global-attributes/the-lang-attribute-004.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /html/dom/elements/global-attributes/the-lang-attribute-005.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /html/dom/elements/global-attributes/the-lang-attribute-006.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /html/dom/elements/global-attributes/the-lang-attribute-007.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /html/dom/elements/global-attributes/the-lang-attribute-008.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /html/dom/elements/global-attributes/the-lang-attribute-009.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /html/dom/elements/global-attributes/the-lang-attribute-010.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /html/dom/elements/global-attributes/the-lang-attribute-011.html | fail | <code>assert_equals: expected (number) 0 but got (undefined) undefined</code> |
| /html/dom/elements/images/bypass-cache-revalidation.html | timeout | <code>palim execution timed out</code> |
| /html/dom/elements/name-content-attribute-and-property.html | fail | <code>assert_equals: assignment to .name should change content attribute expected "bar" but got "foo"</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/dynamic-getter.html | fail | <code>assert_equals: innerText expected "ABC" but got "abc"</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/getter-first-letter-marker-multicol.html | fail | <code>assert_equals: outerText expected (string) "PASS" but got (undefined) undefined</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/getter.html | error | <code>ReferenceError: "CSS" is not defined</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-setter.html | fail | <code>assert_equals: expected "abc&lt;br&gt;def" but got "abc\ndef"</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-whitespace-pre-line.html | fail | <code>assert_equals: expected "\none\ntwo\n\nthree\nfour\n" but got "\n one\n  two\n    \n   three\n    four\n"</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html?white-space=normal | error | <code>TypeError: Cannot convert null to object</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html?white-space=normal&contenteditable=plaintext-only | error | <code>TypeError: Cannot convert null to object</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html?white-space=normal&contenteditable=true | error | <code>TypeError: Cannot convert null to object</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html?white-space=pre | error | <code>TypeError: Cannot convert null to object</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html?white-space=pre&contenteditable=plaintext-only | error | <code>TypeError: Cannot convert null to object</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html?white-space=pre&contenteditable=true | error | <code>TypeError: Cannot convert null to object</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html?white-space=pre-line | error | <code>TypeError: Cannot convert null to object</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html?white-space=pre-line&contenteditable=plaintext-only | error | <code>TypeError: Cannot convert null to object</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html?white-space=pre-line&contenteditable=true | error | <code>TypeError: Cannot convert null to object</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html?white-space=pre-wrap | error | <code>TypeError: Cannot convert null to object</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html?white-space=pre-wrap&contenteditable=plaintext-only | error | <code>TypeError: Cannot convert null to object</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html?white-space=pre-wrap&contenteditable=true | error | <code>TypeError: Cannot convert null to object</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/multiple-text-nodes.window.html | fail | <code>assert_equals: outerText expected (string) "X Y" but got (undefined) undefined</code> |
| /html/dom/elements/the-innertext-and-outertext-properties/outertext-setter.html | fail | <code>assert_equals: expected "A Replaced" but got "A &lt;span id=\"testReplacePrevious\"&gt;B&lt;/span&gt;"</code> |
| /html/syntax/parsing/DOMContentLoaded-defer-task-order.tentative.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/DOMContentLoaded-defer.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/adoption-agency-reparenting-cycle.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/adoption-agency-reparenting-document-target.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/adoption-agency-reparenting-inner-loop-cycle.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/adoption-agency-reparenting-pagehide.tentative.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/adoption-agency-reparenting-shadow-cycle.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/adoption-agency-reparenting-template-cycle.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/adoption-agency-reparenting.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/adoption_agency_check_the_end_tag_name.html | fail | <code>assert_equals: expected "&lt;code some-attribute=\"\"&gt;&lt;div&gt;&lt;code&gt;&lt;code&gt;&lt;code&gt;&lt;code&gt;&lt;/code&gt;&lt;/code&gt;&lt;/code&gt;&lt;/code&gt;&lt;/div&gt;&lt;/code&gt;" but got "&lt;code some-attribute=\"\"&gt;&lt;/code&gt;&lt;div&gt;&lt;code some-attribute=\"\"&gt;&lt;code&gt;&lt;code&gt;&lt;code&gt;&lt;code&gt;&lt;/code&gt;&lt;/code&gt;&lt;/code&gt;&lt;/code&gt;&lt;/code&gt;&lt;/div&gt;"</code> |
| /html/syntax/parsing/ambiguous-ampersand.html | error | <code>TypeError: document.write is not a function. (In "document.write(markup.charAt(i))", it is undefined)</code> |
| /html/syntax/parsing/custom-element-reparenting-shadow-cycle.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/custom-element-reparenting-template-cycle.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/custom-element-reparenting.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/doctype-system-identifier-distinction.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/form-element-pointer-in-template.html | fail | <code>doc.open is not a function. (In "doc.open()", it is undefined)</code> |
| /html/syntax/parsing/foster-parenting-into-document-with-element-child.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/foster-parenting-into-template-element.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/foster-parenting-moved-table.window.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/html-integration-point.html | fail | <code>rawTextElement.textContent.substr is not a function. (In "rawTextElement.textContent.substr(0, 4)", it is undefined)</code> |
| /html/syntax/parsing/html5lib_url.html?file=adoption01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=adoption02 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=blocks | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=comments01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=doctype01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=domjs-unsafe | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=entities01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=entities02 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=foreign-fragment | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=html5test-com | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=inbody01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=isindex | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=main-element | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=math | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=menuitem-element | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=namespace-sensitivity | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=pending-spec-changes | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=pending-spec-changes-plain-text-unsafe | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=plain-text-unsafe | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=processing-instructions | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=quirks01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=ruby | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=scriptdata01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=scripted_adoption01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=scripted_ark | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=scripted_foster01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=scripted_webkit01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=search-element | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=svg | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tables01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=template | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests1 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests10 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests11 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests12 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests14 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests15 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests16 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests17 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests18 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests19 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests2 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests20 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests21 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests22 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests23 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests24 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests25 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests26 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests3 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests4 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests5 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests6 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests7 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests8 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests9 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tests_innerHTML_1 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=tricky01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=void-in-phrasing | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=webkit01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_url.html?file=webkit02 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=adoption01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=adoption02 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=blocks | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=comments01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=doctype01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=domjs-unsafe | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=entities01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=entities02 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=html5test-com | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=inbody01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=isindex | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=main-element | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=menuitem-element | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=namespace-sensitivity | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=pending-spec-changes | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=pending-spec-changes-plain-text-unsafe | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=plain-text-unsafe | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=processing-instructions | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=quirks01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=ruby | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=scriptdata01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=scripted_adoption01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=scripted_ark | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=scripted_foster01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=scripted_webkit01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=search-element | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tables01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=template | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests1 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests10 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests11 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests12 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests14 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests15 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests16 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests17 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests18 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests19 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests2 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests20 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests21 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests22 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests23 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests24 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests25 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests26 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests3 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests5 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests6 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests7 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests8 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tests9 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=tricky01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=void-in-phrasing | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=webkit01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write.html?file=webkit02 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=adoption01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=adoption02 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=blocks | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=comments01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=doctype01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=domjs-unsafe | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=entities01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=entities02 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=html5test-com | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=inbody01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=isindex | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=main-element | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=menuitem-element | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=namespace-sensitivity | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=pending-spec-changes | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=pending-spec-changes-plain-text-unsafe | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=plain-text-unsafe | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=processing-instructions | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=quirks01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=ruby | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=scriptdata01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=scripted_adoption01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=scripted_ark | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=scripted_foster01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=scripted_webkit01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=search-element | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tables01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=template | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests1 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests10 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests11 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests12 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests14 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests15 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests16 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests17 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests18 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests19 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests2 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests20 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests21 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests22 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests23 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests24 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests25 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests26 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests3 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests5 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests6 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests7 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests8 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tests9 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=tricky01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=void-in-phrasing | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=webkit01 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html5lib_write_single.html?file=webkit02 | error | <code>ReferenceError: "fetch" is not defined</code> |
| /html/syntax/parsing/html_content_in_foreign_context.html | fail | <code>e.substr is not a function. (In "e.substr(1)", it is undefined)</code> |
| /html/syntax/parsing/inhead-noscript-head.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/insert-into-nonempty-document.html | fail | <code>doc.open is not a function. (In "doc.open()", it is undefined)</code> |
| /html/syntax/parsing/no-doctype-name.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/template/additions-to-the-in-body-insertion-mode/generating-of-implied-end-tags.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/template/additions-to-the-in-body-insertion-mode/ignore-body-token.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/template/additions-to-the-in-body-insertion-mode/ignore-frameset-token.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/template/additions-to-the-in-body-insertion-mode/ignore-head-token.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/template/additions-to-the-in-body-insertion-mode/ignore-html-token.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/template/additions-to-the-in-body-insertion-mode/start-tag-html.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/template/additions-to-the-in-body-insertion-mode/template-end-tag-without-start-one.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/template/additions-to-the-in-frameset-insertion-mode/end-tag-frameset.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/template/additions-to-the-in-head-insertion-mode/generating-of-implied-end-tags.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/template/additions-to-the-in-head-insertion-mode/template-end-tag-without-start-one.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/template/appending-to-a-template/template-child-nodes.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/template/clearing-the-stack-back-to-a-given-context/clearing-stack-back-to-a-table-body-context.html | fail | <code>assert_equals: Table should have no caption expected (object) null but got (undefined) undefined</code> |
| /html/syntax/parsing/template/clearing-the-stack-back-to-a-given-context/clearing-stack-back-to-a-table-context.html | fail | <code>assert_equals: Table should have no caption expected (object) null but got (undefined) undefined</code> |
| /html/syntax/parsing/template/creating-an-element-for-the-token/template-owner-document.html | timeout | <code>Test timed out</code> |
| /html/syntax/parsing/the-end.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/truncated-markup-declaration-at-eof.html | timeout | <code>palim execution timed out</code> |
| /html/syntax/parsing/unclosed-svg-script.html | fail | <code>assert_true: expected true got false</code> |
| /html/webappapis/dynamic-markup-insertion/html-unsafe-methods/Document-parseHTMLUnsafe-url-base-pushstate.html | error | <code>ReferenceError: "history" is not defined</code> |
| /html/webappapis/dynamic-markup-insertion/html-unsafe-methods/Document-parseHTMLUnsafe-url-base.html | timeout | <code>palim execution timed out</code> |
| /html/webappapis/dynamic-markup-insertion/html-unsafe-methods/Document-parseHTMLUnsafe-url-moretests.html | timeout | <code>palim execution timed out</code> |
| /html/webappapis/dynamic-markup-insertion/html-unsafe-methods/Document-parseHTMLUnsafe-url-pushstate.html | error | <code>ReferenceError: "history" is not defined</code> |
| /html/webappapis/dynamic-markup-insertion/html-unsafe-methods/Document-parseHTMLUnsafe-url.html | timeout | <code>palim execution timed out</code> |
| /html/webappapis/dynamic-markup-insertion/html-unsafe-methods/setHTMLUnsafe-CEReactions.html | fail | <code>assert_equals: myElement1.numConnectedCallback after first setHTMLUnsafe. expected (number) 1 but got (undefined) undefined</code> |
| /html/webappapis/dynamic-markup-insertion/html-unsafe-methods/setHTMLUnsafe-runScripts.html | timeout | <code>palim execution timed out</code> |
| /sanitizer-api/parsehtmlunsafe-with-trustedtypes.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /sanitizer-api/sanitizer-a-navigation.html?target=html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "MouseEvent" is not defined"</code> |
| /sanitizer-api/sanitizer-a-navigation.html?target=mathml | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "MouseEvent" is not defined"</code> |
| /sanitizer-api/sanitizer-a-navigation.html?target=svg | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "MouseEvent" is not defined"</code> |
| /sanitizer-api/sanitizer-custom-elements-constructor.html | error | <code>TypeError: [Function CustomElementRegistry] is not a constructor</code> |
| /sanitizer-api/sanitizer-custom-elements-is.html | error | <code>TypeError: Super class [Function HTMLDivElement] is not a constructor</code> |
| /sanitizer-api/sanitizer-in-adoption-agency.html | fail | <code>"fetch" is not defined</code> |
| /sanitizer-api/sanitizer-inert-document.html | timeout | <code>palim execution timed out</code> |
| /sanitizer-api/sanitizer-modifiers.html | fail | <code>assert_false: If the intersection of config["attributes"] and element["attributes"] with default « » is not empty, then return false. (element: id) expected false got true</code> |
| /sanitizer-api/sanitizer-parseHTML.html | fail | <code>assert_throws_js: function "() =&gt; Document.parseHTML(testcase.data, config)" threw object "Error: Invalid SanitizerConfig" ("Error") expected instance of function "function TypeError() { [native code] }" ("TypeError")</code> |
| /sanitizer-api/sanitizer-script-tokenizer.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "fetch" is not defined"</code> |
| /sanitizer-api/sanitizer-svg-animate.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: Cannot convert undefined to object"</code> |
| /sanitizer-api/sethtml-custom-element-reactions.html | fail | <code>assert_array_equals: lengths differ, expected array ["constructed", "connected"] length 2, got [] length 0</code> |
| /sanitizer-api/sethtml-form-owner.html | fail | <code>assert_equals: expected (object) Element node &lt;form id="f"&gt;&lt;input name="i"&gt;&lt;/form&gt; but got (undefined) undefined</code> |
| /sanitizer-api/sethtml-replace-with-children.html | fail | <code>assert_array_equals: lengths differ, expected array ["constructed", "connected:div"] length 2, got [] length 0</code> |
| /sanitizer-api/sethtml-safety.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "fetch" is not defined"</code> |
| /sanitizer-api/sethtml-scoped-custom-element-registry.html | fail | <code>[Function CustomElementRegistry] is not a constructor</code> |
| /sanitizer-api/sethtml-tree-construction.html | fail | <code>"fetch" is not defined</code> |
| /sanitizer-api/sethtml-with-custom-elements.html | error | <code>TypeError: Super class [Function HTMLDivElement] is not a constructor</code> |
| /sanitizer-api/sethtml-with-declarative-shadow-root.html | fail | <code>assert_equals: expected (string) "open" but got (undefined) undefined</code> |
| /sanitizer-api/sethtml-with-trustedhtml-createParserOptions.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /sanitizer-api/sethtml-with-trustedtypes-createParserOptions-null.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /sanitizer-api/sethtml-with-trustedtypes-createParserOptions-report-only.html | timeout | <code>b'ReferenceError: "trustedTypes" is not defined\n    at http://web-platform.test:8000/sanitizer-api/sethtml-with-trustedtypes-createParserOptions-report-only.html:84:26\nReferenceError: "WebSocket" is not defined\n    at async &lt;anonymous&gt; (http://web-platform.test:8000/trusted-types/support/csp-violations.js:47:11)'</code> |
| /sanitizer-api/sethtml-with-trustedtypes-createParserOptions.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /sanitizer-api/sethtml-with-trustedtypes-immutable.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /sanitizer-api/sethtml-with-trustedtypes.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /sanitizer-api/sethtml-xml-document-sanitizer-report-only.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /sanitizer-api/sethtml-xml-document-sanitizer.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /sanitizer-api/sethtml-xml-document.html | fail | <code>A shadow root cannot be attached to this element</code> |
| /sanitizer-api/sethtmlunsafe-toplevel-template-script.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "fetch" is not defined"</code> |
| /sanitizer-api/trustedhtml-unvetted-parser-options-default-createHTML.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /sanitizer-api/trustedhtml-unvetted-parser-options-default-createParserOptions.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /sanitizer-api/trustedhtml-unvetted-parser-options-no-enforcement.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /sanitizer-api/trustedhtml-unvetted-parser-options-report-only.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /sanitizer-api/trustedhtml-unvetted-parser-options.html | error | <code>ReferenceError: "trustedTypes" is not defined</code> |
| /shadow-dom/Document-caretPositionFromPoint.tentative.html | fail | <code>container.firstChild.getBoundingClientRect is not a function. (In "container.firstChild.getBoundingClientRect()", it is undefined)</code> |
| /shadow-dom/Document-prototype-adoptNode.html | fail | <code>assert_throws_dom: function "function () {<br>            var element = document.createElement('div');<br>            var shadowRoot = element.attachShadow({mode: mode});<br>            newDocument.adoptNode(shadowRoot);<br>        }" did not throw</code> |
| /shadow-dom/Document-prototype-currentScript.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/Document-prototype-importNode.html | fail | <code>assert_throws_dom: function "function () {<br>            var element = document.createElement('div');<br>            var shadowRoot = element.attachShadow({mode: mode});<br>            newDocument.importNode(shadowRoot);<br>        }" did not throw</code> |
| /shadow-dom/DocumentOrShadowRoot-prototype-elementFromPoint.html | fail | <code>document.elementFromPoint is not a function. (In "document.elementFromPoint(...pointInElement(host))", it is undefined)</code> |
| /shadow-dom/Element-interface-attachShadow-custom-element.html | error | <code>TypeError: Super class [Function HTMLInputElement] is not a constructor</code> |
| /shadow-dom/Element-interface-attachShadow.html | fail | <code>assert_throws_dom: Calling attachShadow({mode: "open"}) on a element must throw function "function () {<br>            document.createElement(elementName).attachShadow({mode: "open"});<br>        }" did not throw</code> |
| /shadow-dom/Extensions-to-Event-Interface.html | error | <code>TypeError: event.composedPath is not a function. (In "event.composedPath()", it is undefined)</code> |
| /shadow-dom/HighlightRegistry-highlightsFromPoint.html | fail | <code>assert_throws_js: function "() =&gt; { CSS.highlights.highlightsFromPoint(10, 10, {shadowRoots: [container]}); }" threw object "ReferenceError: "CSS" is not defined" ("ReferenceError") expected instance of function "function TypeError() { [native code] }" ("TypeError")</code> |
| /shadow-dom/MouseEvent-prototype-offsetX-offsetY.html | fail | <code>"MouseEvent" is not defined</code> |
| /shadow-dom/Node-prototype-cloneNode.html | fail | <code>assert_throws_dom: cloneNode(false) on a shadow root in open mode must throw a NotSupportedError function "function () {<br>            var element = document.createElement('div');<br>            var shadowRoot = element.attachShadow({mode: mode});<br>            shadowRoot.cloneNode(false);<br>        }" did not throw</code> |
| /shadow-dom/ShadowRoot-interface.html | fail | <code>assert_equals: ShadowRoot.host must return null if an open shadow tree does not have a focused element expected (object) null but got (undefined) undefined</code> |
| /shadow-dom/Slottable-mixin.html | fail | <code>assert_true: assignedSlot must be defined on Element.prototype expected true got false</code> |
| /shadow-dom/accesskey.tentative.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "navigator" is not defined"</code> |
| /shadow-dom/attachShadow-with-ShadowRoot.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: Cannot convert null to object"</code> |
| /shadow-dom/capturing-and-bubbling-event-listeners-across-shadow-trees.html | error | <code>TypeError: event.composedPath is not a function. (In "event.composedPath()", it is undefined)</code> |
| /shadow-dom/declarative/declarative-parser-interaction.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/declarative-shadow-dom-attachment.html | fail | <code>assert_equals: Correct delegatesFocus expected (boolean) false but got (undefined) undefined</code> |
| /shadow-dom/declarative/declarative-shadow-dom-available-to-element-internals.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/declarative-shadow-dom-basic.html | fail | <code>assert_equals: No leftover template node expected null but got Element node &lt;template shadowrootmode="open"&gt;<br>    &lt;slot id="s1" name="...</code> |
| /shadow-dom/declarative/declarative-shadow-dom-opt-in.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/declarative-shadow-dom-repeats-2.html | fail | <code>assert_true: Remaining shadow root should be open expected true got false</code> |
| /shadow-dom/declarative/declarative-shadow-dom-repeats-slot-assignment.html | fail | <code>assert_true: Shadow root should exist expected true got false</code> |
| /shadow-dom/declarative/declarative-shadow-dom-repeats.html | fail | <code>assert_true: Remaining shadow root should be open expected true got false</code> |
| /shadow-dom/declarative/declarative-shadow-dom-serialization.html | fail | <code>a.getHTML is not a function. (In "a.getHTML({ serializableShadowRoots: true })", it is undefined)</code> |
| /shadow-dom/declarative/declarative-shadow-dom-slot-assignment-serialization.html | fail | <code>assert_equals: expected (string) "manual" but got (undefined) undefined</code> |
| /shadow-dom/declarative/declarative-shadow-dom-slot-assignment.html | fail | <code>assert_equals: Missing attribute should map to named expected (string) "named" but got (undefined) undefined</code> |
| /shadow-dom/declarative/declarative-shadow-dom-write-to-iframe.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: undefined is not a function"</code> |
| /shadow-dom/declarative/gethtml-ordering.html | error | <code>TypeError: host.getHTML is not a function. (In "host.getHTML({shadowRoots: [host.shadowRoot]})", it is undefined)</code> |
| /shadow-dom/declarative/gethtml.html | error | <code>ReferenceError: "light" is not defined</code> |
| /shadow-dom/declarative/innerhtml-before-closing-tag.html | fail | <code>assert_true: Declarative shadow template should not be present expected true got false</code> |
| /shadow-dom/declarative/move-template-before-closing-tag.html | fail | <code>assert_true: Declarative shadow template should not be left over expected true got false</code> |
| /shadow-dom/declarative/script-access.html | fail | <code>assert_equals: expected 3 but got 0</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-disconnect-iframe.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-disconnect.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-duplicate-bare-specifier.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-duplicate-importmap.html | fail | <code>Cannot convert undefined to object</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-duplicate.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-failure.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-mutation-clear.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-mutation-insertrule.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-mutation-reinsert-same.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-mutation-reinsert-swap.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-mutation-remove-middle.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-mutation-replacesync.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-ordering.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch-shared.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-async-fetch.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-basic.html | error | <code>TypeError: Cannot convert null to object</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-clonenode-async-fetch.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-clonenode.html | fail | <code>Cannot convert null to object</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-fetched-module.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-idl-absent-and-empty.html | fail | <code>Cannot convert null to object</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-idl-feature-detection.html | fail | <code>assert_true: HTMLTemplateElement.prototype must expose shadowRootAdoptedStyleSheets. expected true got false</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-idl-reflection.html | fail | <code>assert_equals: Setting the IDL attribute must set the content attribute. expected (string) "foo bar" but got (object) null</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-invalid-specifier.html | fail | <code>Cannot convert undefined to object</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-modulepreload-async.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-modulepreload-basic.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-modulepreload-failure.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-modulepreload-identity.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-modulepreload-nested.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-modulepreload-ordering.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-modulepreload-shared.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-multiple.html | error | <code>TypeError: Cannot convert null to object</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-nested-async.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-nested-sync.html | fail | <code>Cannot convert undefined to object</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-placeholder-identity.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-same-document.html | fail | <code>Cannot convert undefined to object</code> |
| /shadow-dom/declarative/tentative/shadowrootadoptedstylesheets/shadowrootadoptedstylesheets-serialization.html | fail | <code>host.getHTML is not a function. (In "host.getHTML(opts)", it is undefined)</code> |
| /shadow-dom/dragenter-related-target.html | fail | <code>Tried to run in a non-testharness window without a call to set_test_context</code> |
| /shadow-dom/dragleave-related-target.html | fail | <code>Tried to run in a non-testharness window without a call to set_test_context</code> |
| /shadow-dom/event-composed-path-after-dom-mutation.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/event-composed-path-with-related-target.html | fail | <code>"FocusEvent" is not defined</code> |
| /shadow-dom/event-composed-path.html | error | <code>TypeError: e.composedPath is not a function. (In "e.composedPath()", it is undefined)</code> |
| /shadow-dom/event-composed.html | error | <code>TypeError: e.composedPath is not a function. (In "e.composedPath()", it is undefined)</code> |
| /shadow-dom/event-dispatch-order.tentative.html | error | <code>TypeError: e.composedPath is not a function. (In "e.composedPath()", it is undefined)</code> |
| /shadow-dom/event-inside-shadow-tree.html | fail | <code>assert_equals: EventPath must contain [target, parent, shadow root, shadow host] expected 4 but got 3</code> |
| /shadow-dom/event-inside-slotted-node.html | fail | <code>assert_equals: EventPath must contain [target, target parent, slot, slot parent, shadow root, shadow host] expected 6 but got 3</code> |
| /shadow-dom/event-post-dispatch-listenerless.html | fail | <code>assert_equals: target is retargeted to the host expected Element node &lt;div&gt;&lt;/div&gt; but got Element node &lt;div&gt;&lt;/div&gt;</code> |
| /shadow-dom/event-post-dispatch-no-listeners.html | fail | <code>assert_equals: event.target should be the shadow host (retargeted) after dispatch expected Element node &lt;div id="host"&gt;<br>    <br>  &lt;/div&gt; but got Element node &lt;div id="target"&gt;&lt;/div&gt;</code> |
| /shadow-dom/event-post-dispatch.html | error | <code>TypeError: event.composedPath is not a function. (In "event.composedPath()", it is undefined)</code> |
| /shadow-dom/event-with-related-target.html | fail | <code>"MouseEvent" is not defined</code> |
| /shadow-dom/execcommand-insertList-in-shadow.html | fail | <code>promise_test: Unhandled rejection with value: object "Error: Tried to run in a non-testharness window without a call to set_test_context"</code> |
| /shadow-dom/focus-navigation/delegatesFocus-highlight-sibling.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: xmenu1.focus is not a function. (In "xmenu1.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-slot-fallback-default-tabindex.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-slot-fallback.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-slot-nested-2levels.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-slot-nested-delegatesFocus.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-slot-nested-fallback.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-slot-nested.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-slot-shadow-in-fallback.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-slot-shadow-in-slot.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-slot-with-tabindex.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-slots-in-slot.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-slots.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-web-component-radio.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: start.focus is not a function. (In "start.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-navigation-with-delegatesFocus.html | fail | <code>assert_false: expected false got undefined</code> |
| /shadow-dom/focus-navigation/focus-navigation.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-negative-tabindex-at-end-of-shadow-tree.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: Cannot convert null to object"</code> |
| /shadow-dom/focus-navigation/focus-nested-slots.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: div1.focus is not a function. (In "div1.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-reverse-unassignable-slot.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: input2.focus is not a function. (In "input2.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-reverse-unassigned-slot.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-unassignable-slot.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: input1.focus is not a function. (In "input1.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/focus-with-negative-index.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/menu/tentative/focus-menu-elements.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/carousel-grid-order.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/flex-flow.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/flex-visual-fragmentation.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/flex-visual-order.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/flex-visual-wrapped-fragmentation.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-auto-flow-reading-order.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-columns-fragmentation.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-columns.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-001.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-002.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-003.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-004.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-006.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-007.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-008.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-010.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-011.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-012.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-013.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-014.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-015.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-016.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-017.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-018.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-019.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-020.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-column-reading-flow-021.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-row-reading-flow-001.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-row-reading-flow-002.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-row-reading-flow-003.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-row-reading-flow-004.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-row-reading-flow-005.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-row-reading-flow-006.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-row-reading-flow-007.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-row-reading-flow-008.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-row-reading-flow-009.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-row-reading-flow-010.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-lanes-row-reading-flow-011.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-order-across-scopes.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-order-on-shadow-host.html | fail | <code>assert_true: Failed to focus host/B expected true got false</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-order-pseudo-elements.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-order-with-display-contents.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-order-with-iframe.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-order-with-nested-grids.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-order-with-popover.html | error | <code>TypeError: document.querySelector('[popovertarget]').click is not a function. (In "document.querySelector('[popovertarget]').click()", it is undefined)</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-order-with-position-absolute.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-order-with-position-fixed.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-order-with-slots.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-order.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/grid-rows.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/normal.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/source-order-invalid.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/reading-flow/source-order-valid.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/tentative/focus-navigation-scroller-delegatesFocus.html | error | <code>Unhandled rejection: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)</code> |
| /shadow-dom/focus-navigation/tentative/focus-navigation-scroller-interactive-child.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: start.focus is not a function. (In "start.focus()", it is undefined)"</code> |
| /shadow-dom/focus-navigation/tentative/focus-navigation-scroller-tabindex.html | error | <code>Unhandled rejection: fromElement.focus is not a function. (In "fromElement.focus()", it is undefined)</code> |
| /shadow-dom/focus-navigation/tentative/focus-scroller-layout-update.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: scroller.focus is not a function. (In "scroller.focus()", it is undefined)"</code> |
| /shadow-dom/focus-within-shadow.html | fail | <code>Cannot convert null to object</code> |
| /shadow-dom/focus/DocumentOrShadowRoot-activeElement.html | fail | <code>focused.focus is not a function. (In "focused.focus()", it is undefined)</code> |
| /shadow-dom/focus/ShadowRoot-delegatesFocus.html | fail | <code>assert_equals: expected (boolean) false but got (undefined) undefined</code> |
| /shadow-dom/focus/blur-on-shadow-host-delegatesFocus.html | fail | <code>host.focus is not a function. (In "host.focus()", it is undefined)</code> |
| /shadow-dom/focus/click-focus-delegatesFocus-click.html | fail | <code>host.click is not a function. (In "host.click()", it is undefined)</code> |
| /shadow-dom/focus/click-focus-delegatesFocus-tabindex-varies.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/click-focus-delegatesFocus-tabindex-zero.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/click-focus-slot-ancestor.html | fail | <code>promise_test: Unhandled rejection with value: object "Error: Tried to run in a non-testharness window without a call to set_test_context"</code> |
| /shadow-dom/focus/delegatesFocus-tabindex-change.html | fail | <code>host.focus is not a function. (In "host.focus()", it is undefined)</code> |
| /shadow-dom/focus/focus-autofocus.html | fail | <code>host.focus is not a function. (In "host.focus()", it is undefined)</code> |
| /shadow-dom/focus/focus-click-on-shadow-host.html | fail | <code>assert_equals: expected (object) Element node &lt;body&gt;<br>  &lt;div id="host"&gt;&lt;/div&gt;<br><br><br>&lt;script&gt;<br>const host = do... but got (undefined) undefined</code> |
| /shadow-dom/focus/focus-method-delegatesFocus.html | fail | <code>host.focus is not a function. (In "host.focus()", it is undefined)</code> |
| /shadow-dom/focus/focus-method-with-delegatesFocus.html | fail | <code>xshadow0.focus is not a function. (In "xshadow0.focus()", it is undefined)</code> |
| /shadow-dom/focus/focus-preserved-on-slot-reorder.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: input.focus is not a function. (In "input.focus()", it is undefined)"</code> |
| /shadow-dom/focus/focus-pseudo-matches-on-shadow-host.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/focus/focus-scroll-under-delegatesFocus.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/focus-selector-delegatesFocus.html | fail | <code>shadowChild.focus is not a function. (In "shadowChild.focus()", it is undefined)</code> |
| /shadow-dom/focus/focus-shadowhost-display-none.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: host.focus is not a function. (In "host.focus()", it is undefined)"</code> |
| /shadow-dom/focus/focus-slot-box-generated-tabindex-0.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: Cannot convert null to object"</code> |
| /shadow-dom/focus/focus-tab-on-shadow-host.html | fail | <code>assert_equals: expected (object) Element node &lt;body&gt;<br>  &lt;div id="host"&gt;&lt;/div&gt;<br><br><br>&lt;script&gt;<br>const host = do... but got (undefined) undefined</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-negative-delegatesFocus.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-negative.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-slot-one.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-varying-delegatesFocus.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-varying-tabindex-2.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: root1.querySelector("input").focus is not a function. (In "root1.querySelector("input").focus()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-varying-tabindex-3.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: root1.querySelector("input").focus is not a function. (In "root1.querySelector("input").focus()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-varying-tabindex.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-zero-delegatesFocus.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-zero-host-negative.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-zero-host-not-set-scrollable.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-zero-host-not-set.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-zero-host-one.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-zero-host-scrollable.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/focus-tabindex-order-shadow-zero.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
| /shadow-dom/focus/text-selection-with-delegatesFocus-on-slotted-content.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: host.shadowRoot.firstElementChild.show is not a function. (In "host.shadowRoot.firstElementChild.show()", it is undefined)"</code> |
| /shadow-dom/focus/text-selection-with-delegatesFocus-text-control.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "getSelection" is not defined"</code> |
| /shadow-dom/focus/text-selection-with-delegatesFocus.html | fail | <code>promise_test: Unhandled rejection with value: object "ReferenceError: "getSelection" is not defined"</code> |
| /shadow-dom/form-control-form-attribute.html | fail | <code>assert_equals: expected (object) Element node &lt;form id="form"&gt;form&lt;/form&gt; but got (undefined) undefined</code> |
| /shadow-dom/imperative-slot-api-cross-shadow-root.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: slotA.assign is not a function. (In "slotA.assign(nodeN)", it is undefined)"</code> |
| /shadow-dom/imperative-slot-api-disconnected.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: slot1.assign is not a function. (In "slot1.assign(div)", it is undefined)"</code> |
| /shadow-dom/imperative-slot-api-slotchange.html | fail | <code>tTree.s1.assign is not a function. (In "tTree.s1.assign(tTree.c1)", it is undefined)</code> |
| /shadow-dom/imperative-slot-api.html | fail | <code>assert_equals: slotAssignment should return "manual" expected (string) "manual" but got (undefined) undefined</code> |
| /shadow-dom/imperative-slot-fallback-clear.html | fail | <code>slot.assign is not a function. (In "slot.assign(host.firstChild)", it is undefined)</code> |
| /shadow-dom/imperative-slot-initial-fallback.html | fail | <code>assert_greater_than: Fallback content should be rendered expected a number but got a "undefined"</code> |
| /shadow-dom/innerHTML-setter.xhtml | fail | <code>Cannot convert null to object</code> |
| /shadow-dom/input-element-list.html | fail | <code>assert_equals: expected (object) null but got (undefined) undefined</code> |
| /shadow-dom/input-type-radio.html | fail | <code>assert_false: expected false got undefined</code> |
| /shadow-dom/inserting-fragment-under-shadow-host.html | timeout | <code>b'at &lt;anonymous&gt; (http://web-platform.test:8000/shadow-dom/inserting-fragment-under-shadow-host.html:15:25)'</code> |
| /shadow-dom/leaktests/html-collection.html | fail | <code>Cannot convert undefined to object</code> |
| /shadow-dom/leaktests/selection.html | fail | <code>promise_test: Unhandled rejection with value: object "Error: Tried to run in a non-testharness window without a call to set_test_context"</code> |
| /shadow-dom/leaktests/window-frames.html | fail | <code>assert_equals: window.frames should return only frames in document. expected (number) 1 but got (undefined) undefined</code> |
| /shadow-dom/manual-slot-assignment-with-details.html | fail | <code>slot.assign is not a function. (In "slot.assign(child)", it is undefined)</code> |
| /shadow-dom/offsetParent-across-shadow-boundaries.html | fail | <code>assert_equals: expected (object) Element node &lt;div id="relativeParent" style="position: relative; paddi... but got (undefined) undefined</code> |
| /shadow-dom/offsetTop-offsetLeft-across-shadow-boundaries.html | fail | <code>assert_equals: expected (number) 38 but got (undefined) undefined</code> |
| /shadow-dom/reference-target/tentative/aria-labelledby.html | error | <code>TypeError: Cannot convert null to object</code> |
| /shadow-dom/reference-target/tentative/commandfor.html | fail | <code>Cannot convert null to object</code> |
| /shadow-dom/reference-target/tentative/dom-mutation.html | fail | <code>promise_test: Unhandled rejection with value: object "Error: Tried to run in a non-testharness window without a call to set_test_context"</code> |
| /shadow-dom/reference-target/tentative/event-path.html | fail | <code>Cannot convert null to object</code> |
| /shadow-dom/reference-target/tentative/form.html | fail | <code>Cannot convert null to object</code> |
| /shadow-dom/reference-target/tentative/gethtml-serialization.html | fail | <code>host.getHTML is not a function. (In "host.getHTML({shadowRoots: [host.shadowRoot]})", it is undefined)</code> |
| /shadow-dom/reference-target/tentative/interestfor.tentative.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: Cannot convert null to object"</code> |
| /shadow-dom/reference-target/tentative/label-descendant.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: Cannot convert null to object"</code> |
| /shadow-dom/reference-target/tentative/label-for.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: Cannot convert null to object"</code> |
| /shadow-dom/reference-target/tentative/label-lifetime.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: Cannot convert undefined to object"</code> |
| /shadow-dom/reference-target/tentative/popovertarget.html | fail | <code>Cannot convert null to object</code> |
| /shadow-dom/reference-target/tentative/property-reflection-idl-setters.html | fail | <code>assert_array_equals: lengths differ, expected array ["host-id"] length 1, got [] length 0</code> |
| /shadow-dom/reference-target/tentative/property-reflection-imperative-setup.html | fail | <code>assert_equals: expected Element node &lt;div id="host-id"&gt;&lt;/div&gt; but got null</code> |
| /shadow-dom/reference-target/tentative/property-reflection.html | fail | <code>assert_equals: expected Element node &lt;div id="host-id"&gt;<br>        <br>      &lt;/div&gt; but got null</code> |
| /shadow-dom/reference-target/tentative/reference-target-basics.html | fail | <code>Cannot convert null to object</code> |
| /shadow-dom/reference-target/tentative/shadowrootreferencetarget-idl-reflection.html | fail | <code>assert_true: HTMLTemplateElement should expose the shadowRootReferenceTarget IDL attribute expected true got false</code> |
| /shadow-dom/scroll-restore-shadow.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: Cannot convert null to object"</code> |
| /shadow-dom/scroll-to-the-fragment-in-shadow-tree.html | timeout | <code>b'TypeError: window.scrollTo is not a function. (In "window.scrollTo(0, 0)", it is undefined)\n    at executeNextTest (http://web-platform.test:8000/shadow-dom/scroll-to-the-fragment-in-shadow-tree.html:34:24)\n    at http://web-platform.test:8000/shadow-dom/scroll-to-the-fragment-in-shadow-tree.html:110:1'</code> |
| /shadow-dom/shadow-root-clonable.html | fail | <code>assert_true: clonable attribute expected true got undefined</code> |
| /shadow-dom/slotchange-customelements.html | fail | <code>assert_true: expected true got false</code> |
| /shadow-dom/slotchange-event.html | timeout | <code>b'TypeError: The childList option must be true\n    at &lt;anonymous&gt; (http://web-platform.test:8000/shadow-dom/slotchange-event.html:279:31)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/shadow-dom/slotchange-event.html:279:31)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/shadow-dom/slotchange-event.html:279:31)\n    at &lt;anonymous&gt; (http://web-platform.test:8000/shadow-dom/slotchange-event.html:279:31)'</code> |
| /shadow-dom/slotchange.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/slots-fallback-in-document.html | fail | <code>assert_array_equals: expected property 0 to be Element node &lt;slot id="slot"&gt;&lt;div id="fallback"&gt;This is fallback conte... but got Element node &lt;div id="fallback"&gt;This is fallback content&lt;/div&gt; (expected array [Element node &lt;slot id="slot"&gt;&lt;div id="fallback"&gt;This is fallback conte...] got [Element node &lt;div id="fallback"&gt;This is fallback content&lt;/div&gt;])</code> |
| /shadow-dom/slots-fallback.html | fail | <code>assert_equals: expected (object) null but got (undefined) undefined</code> |
| /shadow-dom/slots-outside-shadow-dom.html | fail | <code>assert_array_equals: expected property 0 to be Element node &lt;slot&gt;foo&lt;/slot&gt; but got Text node "foo" (expected array [Element node &lt;slot&gt;foo&lt;/slot&gt;] got [Text node "foo"])</code> |
| /shadow-dom/slots.html | fail | <code>assert_equals: expected (object) Element node &lt;slot id="s1" name="slot1"&gt;&lt;/slot&gt; but got (undefined) undefined</code> |
| /shadow-dom/touch-event-retargeting-leak.html | fail | <code>promise_test: Unhandled rejection with value: object "Error: Tried to run in a non-testharness window without a call to set_test_context"</code> |
| /shadow-dom/untriaged/elements-and-dom-objects/extensions-to-element-interface/methods/test-002.html | fail | <code>assert_equals: attachShadow() method should establish the context object as the shadow host of the ShadowRoot object expected (number) 0 but got (undefined) undefined</code> |
| /shadow-dom/untriaged/elements-and-dom-objects/shadowroot-object/shadowroot-attributes/activeElement-confirm-return-null.html | fail | <code>assert_equals: activeElement attribute of the ShadowRoot must return null if there's no focused element expected (object) null but got (undefined) undefined</code> |
| /shadow-dom/untriaged/elements-and-dom-objects/shadowroot-object/shadowroot-attributes/test-007.html | fail | <code>inp.focus is not a function. (In "inp.focus()", it is undefined)</code> |
| /shadow-dom/untriaged/elements-and-dom-objects/shadowroot-object/shadowroot-attributes/test-011.html | fail | <code>assert_true: ShadowRoot styleSheets attribute shouldn't be null expected true got false</code> |
| /shadow-dom/untriaged/elements-and-dom-objects/shadowroot-object/shadowroot-methods/test-004.html | fail | <code>s.getSelection is not a function. (In "s.getSelection()", it is undefined)</code> |
| /shadow-dom/untriaged/elements-and-dom-objects/shadowroot-object/shadowroot-methods/test-006.html | fail | <code>s.elementFromPoint is not a function. (In "s.elementFromPoint(1, 1)", it is undefined)</code> |
| /shadow-dom/untriaged/elements-and-dom-objects/shadowroot-object/shadowroot-methods/test-007.html | fail | <code>s.elementFromPoint is not a function. (In "s.elementFromPoint(-1, 1)", it is undefined)</code> |
| /shadow-dom/untriaged/elements-and-dom-objects/shadowroot-object/shadowroot-methods/test-010.html | fail | <code>assert_equals: Wrong exception type expected (number) 9 but got (undefined) undefined</code> |
| /shadow-dom/untriaged/events/event-dispatch/test-002.html | fail | <code>The event interface "MouseEvents" is not supported</code> |
| /shadow-dom/untriaged/events/event-dispatch/test-003.html | fail | <code>input1.focus is not a function. (In "input1.focus()", it is undefined)</code> |
| /shadow-dom/untriaged/events/event-retargeting/test-001.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/untriaged/events/retargeting-focus-events/test-001.html | fail | <code>inp1.focus is not a function. (In "inp1.focus()", it is undefined)</code> |
| /shadow-dom/untriaged/events/retargeting-focus-events/test-002.html | fail | <code>roots.playerShadowRoot.querySelector('.volume-slider').focus is not a function. (In "roots.playerShadowRoot.querySelector('.volume-slider').focus()", it is undefined)</code> |
| /shadow-dom/untriaged/events/retargeting-focus-events/test-003.html | fail | <code>d.querySelector('#outside-control').focus is not a function. (In "d.querySelector('#outside-control').focus()", it is undefined)</code> |
| /shadow-dom/untriaged/events/retargeting-relatedtarget/test-001.html | fail | <code>The event interface "MouseEvents" is not supported</code> |
| /shadow-dom/untriaged/events/retargeting-relatedtarget/test-002.html | fail | <code>The event interface "MouseEvents" is not supported</code> |
| /shadow-dom/untriaged/events/retargeting-relatedtarget/test-003.html | fail | <code>"MouseEvent" is not defined</code> |
| /shadow-dom/untriaged/events/test-001.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/untriaged/html-elements-in-shadow-trees/html-forms/test-003.html | timeout | <code>palim execution timed out</code> |
| /shadow-dom/untriaged/html-elements-in-shadow-trees/inert-html-elements/test-001.html | fail | <code>link.click is not a function. (In "link.click()", it is undefined)</code> |
| /shadow-dom/untriaged/html-elements-in-shadow-trees/inert-html-elements/test-002.html | fail | <code>Cannot convert undefined to object</code> |
| /shadow-dom/untriaged/shadow-trees/upper-boundary-encapsulation/dom-tree-accessors-001.html | fail | <code>Cannot convert undefined to object</code> |
| /shadow-dom/untriaged/shadow-trees/upper-boundary-encapsulation/test-005.html | fail | <code>assert_equals: Elements in shadow DOM must not be accessible from owner's document label.for attribute expected (object) null but got (undefined) undefined</code> |
| /shadow-dom/untriaged/shadow-trees/upper-boundary-encapsulation/test-007.html | fail | <code>assert_equals: Elements in shadow DOM must be accessible from shadow document label.for attribute expected (object) Element node &lt;input type="text" id="input_id"&gt;&lt;/input&gt; but got (undefined) undefined</code> |
| /shadow-dom/untriaged/shadow-trees/upper-boundary-encapsulation/test-011.html | fail | <code>Cannot convert undefined to object</code> |
| /shadow-dom/untriaged/styles/test-001.html | fail | <code>assert_true: CSS styles declared in enclosing tree must not be applied in a shadow tree if the apply-author-styles flag is set to false expected true got false</code> |
| /shadow-dom/untriaged/styles/test-003.html | fail | <code>Cannot convert undefined to object</code> |
| /shadow-dom/untriaged/styles/test-005.html | fail | <code>assert_true: CSS styles declared in shadow tree must not be applied to the elements in the document tree expected true got false</code> |
| /shadow-dom/untriaged/styles/test-008.html | fail | <code>assert_equals: Element should not be rendered expected (number) 0 but got (undefined) undefined</code> |
| /shadow-dom/untriaged/user-interaction/active-element/test-001.html | fail | <code>inp.focus is not a function. (In "inp.focus()", it is undefined)</code> |
| /shadow-dom/untriaged/user-interaction/active-element/test-002.html | fail | <code>inp.focus is not a function. (In "inp.focus()", it is undefined)</code> |
| /shadow-dom/untriaged/user-interaction/editing/inheritance-of-content-editable-001.html | fail | <code>assert_equals: expected (string) "inherit" but got (undefined) undefined</code> |
| /shadow-dom/untriaged/user-interaction/ranges-and-selections/test-001.html | fail | <code>window.getSelection is not a function. (In "window.getSelection()", it is undefined)</code> |
| /shadow-dom/untriaged/user-interaction/ranges-and-selections/test-002.html | fail | <code>d.defaultView.getSelection is not a function. (In "d.defaultView.getSelection()", it is undefined)</code> |
| /shadow-dom/wheel-event-related-target.html | fail | <code>promise_test: Unhandled rejection with value: object "Error: Tried to run in a non-testharness window without a call to set_test_context"</code> |
| /streams/writable-streams/aborting.any.html | fail | <code>WritableStream construction is not implemented</code> |
| /streams/writable-streams/aborting.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/aborting.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/aborting.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/bad-strategies.any.html | fail | <code>assert_throws_exactly: construction should re-throw the error function "() =&gt; {<br>    new WritableStream({}, {<br>      get size() {<br>        throw error1;<br>      },<br>      highWaterMark: 5<br>    });<br>  }" threw object "TypeError: WritableStream construction is not implemented" but we expected it to throw object "error1: a unique string"</code> |
| /streams/writable-streams/bad-strategies.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/bad-strategies.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/bad-strategies.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/bad-underlying-sinks.any.html | fail | <code>assert_throws_exactly: constructor should throw same error as throwing start getter function "() =&gt; {<br>    new WritableStream({<br>      get start() {<br>        throw error1;<br>      }<br>    });<br>  }" threw object "TypeError: WritableStream construction is not implemented" but we expected it to throw object "error1: error1"</code> |
| /streams/writable-streams/bad-underlying-sinks.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/bad-underlying-sinks.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/bad-underlying-sinks.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/byte-length-queuing-strategy.any.html | fail | <code>"ByteLengthQueuingStrategy" is not defined</code> |
| /streams/writable-streams/byte-length-queuing-strategy.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/byte-length-queuing-strategy.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/byte-length-queuing-strategy.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/close.any.html | fail | <code>WritableStream construction is not implemented</code> |
| /streams/writable-streams/close.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/close.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/close.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/constructor.any.html | fail | <code>WritableStream construction is not implemented</code> |
| /streams/writable-streams/constructor.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/constructor.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/constructor.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/count-queuing-strategy.any.html | fail | <code>"CountQueuingStrategy" is not defined</code> |
| /streams/writable-streams/count-queuing-strategy.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/count-queuing-strategy.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/count-queuing-strategy.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/crashtests/garbage-collection.any.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: WritableStream construction is not implemented"</code> |
| /streams/writable-streams/crashtests/garbage-collection.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/crashtests/garbage-collection.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/crashtests/garbage-collection.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/error.any.html | fail | <code>WritableStream construction is not implemented</code> |
| /streams/writable-streams/error.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/error.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/error.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/floating-point-total-queue-size.any.html | fail | <code>WritableStream construction is not implemented</code> |
| /streams/writable-streams/floating-point-total-queue-size.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/floating-point-total-queue-size.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/floating-point-total-queue-size.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/garbage-collection.any.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: WritableStream construction is not implemented"</code> |
| /streams/writable-streams/garbage-collection.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/garbage-collection.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/garbage-collection.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/general.any.html | fail | <code>WritableStream construction is not implemented</code> |
| /streams/writable-streams/general.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/general.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/general.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/properties.any.html | fail | <code>WritableStream construction is not implemented</code> |
| /streams/writable-streams/properties.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/properties.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/properties.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/reentrant-strategy.any.html | fail | <code>WritableStream construction is not implemented</code> |
| /streams/writable-streams/reentrant-strategy.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/reentrant-strategy.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/reentrant-strategy.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/start.any.html | fail | <code>WritableStream construction is not implemented</code> |
| /streams/writable-streams/start.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/start.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/start.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /streams/writable-streams/write.any.html | fail | <code>WritableStream construction is not implemented</code> |
| /streams/writable-streams/write.any.serviceworker.html | error | <code>Unhandled rejection: "navigator" is not defined</code> |
| /streams/writable-streams/write.any.sharedworker.html | error | <code>ReferenceError: "SharedWorker" is not defined</code> |
| /streams/writable-streams/write.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/IdnaTestV2-removed.any.html | fail | <code>"fetch" is not defined</code> |
| /url/IdnaTestV2.any.html | fail | <code>"fetch" is not defined</code> |
| /url/a-element-origin-xhtml.xhtml | fail | <code>"fetch" is not defined</code> |
| /url/a-element-origin.html | fail | <code>"fetch" is not defined</code> |
| /url/a-element-xhtml.xhtml?exclude=(file|javascript|mailto) | fail | <code>"fetch" is not defined</code> |
| /url/a-element-xhtml.xhtml?include=file | fail | <code>"fetch" is not defined</code> |
| /url/a-element-xhtml.xhtml?include=javascript | fail | <code>"fetch" is not defined</code> |
| /url/a-element-xhtml.xhtml?include=mailto | fail | <code>"fetch" is not defined</code> |
| /url/a-element.html?exclude=(file|javascript|mailto) | fail | <code>"fetch" is not defined</code> |
| /url/a-element.html?include=file | fail | <code>"fetch" is not defined</code> |
| /url/a-element.html?include=javascript | fail | <code>"fetch" is not defined</code> |
| /url/a-element.html?include=mailto | fail | <code>"fetch" is not defined</code> |
| /url/data-uri-fragment.html | timeout | <code>palim execution timed out</code> |
| /url/failure.html | fail | <code>"fetch" is not defined</code> |
| /url/historical.any.html | fail | <code>assert_throws_js: function "function() {<br>    url.href = "./bar";<br>  }" threw object "Error: Invalid URL" ("Error") expected instance of function "function TypeError() { [native code] }" ("TypeError")</code> |
| /url/historical.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/idlharness.any.html | fail | <code>"fetch" is not defined</code> |
| /url/idlharness.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/javascript-urls.window.html | fail | <code>anchor.click is not a function. (In "anchor.click()", it is undefined)</code> |
| /url/percent-encoding.window.html | fail | <code>"fetch" is not defined</code> |
| /url/toascii.window.html | fail | <code>"fetch" is not defined</code> |
| /url/url-constructor.any.html?exclude=(file|javascript|mailto) | fail | <code>"fetch" is not defined</code> |
| /url/url-constructor.any.html?include=file | fail | <code>"fetch" is not defined</code> |
| /url/url-constructor.any.html?include=javascript | fail | <code>"fetch" is not defined</code> |
| /url/url-constructor.any.html?include=mailto | fail | <code>"fetch" is not defined</code> |
| /url/url-constructor.any.worker.html?exclude=(file|javascript|mailto) | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-constructor.any.worker.html?include=file | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-constructor.any.worker.html?include=javascript | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-constructor.any.worker.html?include=mailto | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-origin.any.html | fail | <code>"fetch" is not defined</code> |
| /url/url-origin.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-searchparams.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-setters-a-area.window.html?exclude=(file|javascript|mailto) | fail | <code>"fetch" is not defined</code> |
| /url/url-setters-a-area.window.html?include=file | fail | <code>"fetch" is not defined</code> |
| /url/url-setters-a-area.window.html?include=javascript | fail | <code>"fetch" is not defined</code> |
| /url/url-setters-a-area.window.html?include=mailto | fail | <code>"fetch" is not defined</code> |
| /url/url-setters-stripping.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-setters.any.html?exclude=(file|javascript|mailto) | fail | <code>"fetch" is not defined</code> |
| /url/url-setters.any.html?include=file | fail | <code>"fetch" is not defined</code> |
| /url/url-setters.any.html?include=javascript | fail | <code>"fetch" is not defined</code> |
| /url/url-setters.any.html?include=mailto | fail | <code>"fetch" is not defined</code> |
| /url/url-setters.any.worker.html?exclude=(file|javascript|mailto) | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-setters.any.worker.html?include=file | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-setters.any.worker.html?include=javascript | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-setters.any.worker.html?include=mailto | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-statics-canparse.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-statics-parse.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/url-tojson.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/urlencoded-parser.any.html | fail | <code>"Request" is not defined</code> |
| /url/urlencoded-parser.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/urlsearchparams-append.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/urlsearchparams-constructor.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/urlsearchparams-delete.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/urlsearchparams-foreach.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/urlsearchparams-get.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/urlsearchparams-getall.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/urlsearchparams-has.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/urlsearchparams-set.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/urlsearchparams-size.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/urlsearchparams-sort.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /url/urlsearchparams-stringifier.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /xhr/formdata.html | error | <code>ReferenceError: "Blob" is not defined</code> |
| /xhr/formdata/append-formelement.html | fail | <code>Constructing FormData from a form is not supported</code> |
| /xhr/formdata/append.any.html | fail | <code>"Blob" is not defined</code> |
| /xhr/formdata/append.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /xhr/formdata/constructor-formelement.html | fail | <code>assert_equals: input.value when type=text should not contain newlines expected "value" but got "value\n\r"</code> |
| /xhr/formdata/constructor-submitter-coordinate.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: submitter.getBoundingClientRect is not a function. (In "submitter.getBoundingClientRect()", it is undefined)"</code> |
| /xhr/formdata/constructor-submitter.html | fail | <code>Constructing FormData from a form is not supported</code> |
| /xhr/formdata/constructor.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /xhr/formdata/delete-formelement.html | fail | <code>Constructing FormData from a form is not supported</code> |
| /xhr/formdata/delete.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /xhr/formdata/foreach.any.html | error | <code>ReferenceError: "File" is not defined</code> |
| /xhr/formdata/foreach.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /xhr/formdata/get-formelement.html | fail | <code>Constructing FormData from a form is not supported</code> |
| /xhr/formdata/get.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /xhr/formdata/has-formelement.html | fail | <code>Constructing FormData from a form is not supported</code> |
| /xhr/formdata/has.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /xhr/formdata/iteration.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /xhr/formdata/set-blob.any.html | fail | <code>"Blob" is not defined</code> |
| /xhr/formdata/set-blob.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /xhr/formdata/set-formelement.html | fail | <code>Constructing FormData from a form is not supported</code> |
| /xhr/formdata/set.any.html | fail | <code>"Blob" is not defined</code> |
| /xhr/formdata/set.any.worker.html | error | <code>ReferenceError: "Worker" is not defined</code> |
| /xhr/formdata/submitter-coordinate-value.html | fail | <code>promise_test: Unhandled rejection with value: object "TypeError: element.getClientRects is not a function. (In "element.getClientRects()", it is undefined)"</code> |
