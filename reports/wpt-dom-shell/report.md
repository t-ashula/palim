# WPT progress report

Run status: failed

Source: wpt/wpt@4fa34c721570cad34ee7283bf531811eafed6010

## URL progress

| Area | Total | Executed | Pass | Fail | Skip | Error | Timeout | Pending | Progress | Pass rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| All | 906 | 906 | 255 | 197 | 450 | 4 | 0 | 0 | 100.00% | 28.15% |
| /dom/abort/ | 6 | 6 | 0 | 4 | 2 | 0 | 0 | 0 | 100.00% | 0.00% |
| /dom/collections/ | 12 | 12 | 5 | 6 | 1 | 0 | 0 | 0 | 100.00% | 41.67% |
| /dom/events/ | 182 | 182 | 20 | 20 | 142 | 0 | 0 | 0 | 100.00% | 10.99% |
| /dom/lists/ | 5 | 5 | 1 | 3 | 1 | 0 | 0 | 0 | 100.00% | 20.00% |
| /dom/nodes/ | 408 | 408 | 154 | 103 | 148 | 3 | 0 | 0 | 100.00% | 37.75% |
| /dom/ranges/ | 68 | 68 | 7 | 13 | 48 | 0 | 0 | 0 | 100.00% | 10.29% |
| /dom/traversal/ | 18 | 18 | 9 | 1 | 8 | 0 | 0 | 0 | 100.00% | 50.00% |
| /domparsing/ | 91 | 91 | 21 | 13 | 56 | 1 | 0 | 0 | 100.00% | 23.08% |
| /html/dom/documents/dom-tree-accessors/ | 57 | 57 | 29 | 23 | 5 | 0 | 0 | 0 | 100.00% | 50.88% |
| /html/dom/elements/ | 59 | 59 | 9 | 11 | 39 | 0 | 0 | 0 | 100.00% | 15.25% |

## Executed subtests

| Total | Pass | Fail | Skip | Error | Timeout | Pass rate |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 5324 | 3467 | 1403 | 450 | 4 | 0 | 65.12% |

## Non-passing executed tests

| URL | Status | Message |
| --- | --- | --- |
| /dom/abort/AbortSignal.any.js | fail | AbortSignal.abort is not a function |
| /dom/abort/abort-signal-any.any.js | fail | signalInterface.any is not a function |
| /dom/abort/abort-signal-timeout.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/abort/event.any.js | fail | assert_true: event should be trusted expected true got false |
| /dom/abort/reason-constructor.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/abort/timeout.any.js | fail | AbortSignal.timeout is not a function |
| /dom/collections/HTMLCollection-as-prototype.html | fail | assert_throws_js: function "function() {     obj.length;   }" did not throw |
| /dom/collections/HTMLCollection-delete.html | fail | assert_throws_js: function "function() {     "use strict";     delete c[0];   }" did not throw |
| /dom/collections/HTMLCollection-live-mutations.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/collections/HTMLCollection-own-props.html | fail | assert_equals: expected (object) Element node <a id="named"></a> but got (undefined) undefined |
| /dom/collections/HTMLCollection-supported-property-indices.html | fail | assert_equals: expected (object) Element node <foo id="-2"></foo> but got (undefined) undefined |
| /dom/collections/HTMLCollection-supported-property-names.html | fail | assert_array_equals: lengths differ, expected array ["0", "1", "2", "3", "4", "5", "6", "7", "some-id", "some-name", "another-id", "another-name"] length 12, got [] length 0 |
| /dom/collections/namednodemap-supported-property-names.html | fail | assert_array_equals: lengths differ, expected array ["0", "1", "id", "class"] length 4, got [] length 0 |
| /dom/events/AddEventListenerOptions-passive.any.js | fail | assert_true: addEventListener doesn't support the passive option expected true got false |
| /dom/events/Body-FrameSet-Event-Handlers.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/CustomEvent.html | fail | assert_throws_js: function "function() {         e.initCustomEvent();     }" did not throw |
| /dom/events/Event-cancelBubble.html | fail | assert_false: cancelBubble must be false after an event has been dispatched. expected false got true |
| /dom/events/Event-constants.html | fail | assert_true: Object [object Object] doesn't have NONE expected true got false |
| /dom/events/Event-constructors.any.js | fail | assert_throws_js: function "function() {     new Event()   }" did not throw |
| /dom/events/Event-dispatch-bubble-canceled.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-bubbles-false.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-bubbles-true.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-click.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-click.tentative.html | fail | MouseEvent is not defined |
| /dom/events/Event-dispatch-detached-input-and-change.html | fail | MouseEvent is not defined |
| /dom/events/Event-dispatch-handlers-changed.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-listener-order.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/events/Event-dispatch-multiple-cancelBubble.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-multiple-stopPropagation.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-omitted-capture.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-on-disabled-elements.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-order-at-target.html | fail | assert_array_equals: bubbles: true expected property 0 to be "capturing" but got "bubbling" (expected array ["capturing", "bubbling"] got ["bubbling", "capturing"]) |
| /dom/events/Event-dispatch-order.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-propagation-stopped.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-redispatch.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-reenter.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-single-activation-behavior.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-target-moved.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-target-removed.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-throwing-multiple-globals.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-dispatch-throwing.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-init-while-dispatching.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-initEvent.html | fail | assert_throws_js: function "function() {     e.initEvent()   }" did not throw |
| /dom/events/Event-isTrusted.any.js | fail | assert_equals: expected "function" but got "undefined" |
| /dom/events/Event-propagation.html | fail | assert_equals: Propagation flag expected false but got true |
| /dom/events/Event-stopPropagation-cancel-bubbling.html | fail | MouseEvent is not defined |
| /dom/events/Event-subclasses-constructors.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-timestamp-cross-realm-getter.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-timestamp-high-resolution.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-timestamp-high-resolution.https.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/Event-timestamp-safe-resolution.html | fail | MouseEvent is not defined |
| /dom/events/EventListener-addEventListener.sub.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/events/EventListener-handleEvent-cross-realm.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/EventListener-handleEvent.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/EventListener-incumbent-global-1.sub.html | skip | host-unsupported: source requires WPT substitution preprocessing |
| /dom/events/EventListener-incumbent-global-2.sub.html | skip | host-unsupported: source requires WPT substitution preprocessing |
| /dom/events/EventListener-invoke-legacy.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/EventListenerOptions-capture.html | fail | assert_equals: Incorrect event phase for value: true expected 1 but got 3 |
| /dom/events/EventTarget-add-listener-platform-object.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/EventTarget-constructible.any.js | fail | assert_array_equals: lengths differ, expected array [] length 0, got [object "[object Object]"] length 1 |
| /dom/events/EventTarget-dispatchEvent.html | fail | The event interface "BeforeUnloadEvent" is not supported |
| /dom/events/EventTarget-window-constructor.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/KeyEvent-initKeyEvent.html | fail | The event interface "KeyboardEvent" is not supported |
| /dom/events/click-on-absolute-pseudo.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/event-disabled-dynamic.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/event-global-event-targets.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/event-global-extra.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/events/event-global-is-still-set-when-coercing-beforeunload-result.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/event-global-is-still-set-when-reporting-exception-onerror.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/event-global-replaceable.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/event-global-set-before-handleEvent-lookup.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/events/event-global.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/event-global.worker.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/events/event-handler-attribute-replace-preserves-passive.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/event-listener-not-fully-active-adopted-node.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/event-listener-not-fully-active-callback.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/event-listener-not-fully-active-navigated.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/event-listener-not-fully-active-target.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/focus-event-document-move.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/handler-count.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/legacy-pre-activation-behavior.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/events/mouse-event-retarget.html | fail | target is not defined |
| /dom/events/no-focus-events-at-clicking-editable-content-in-link.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-mousewheel-event-listener-on-body.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-mousewheel-event-listener-on-div.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-mousewheel-event-listener-on-document.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-mousewheel-event-listener-on-root.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-mousewheel-event-listener-on-window.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-touchmove-event-listener-on-body.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-touchmove-event-listener-on-div.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-touchmove-event-listener-on-document.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-touchmove-event-listener-on-root.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-touchmove-event-listener-on-window.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-touchstart-event-listener-on-body.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-touchstart-event-listener-on-div.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-touchstart-event-listener-on-document.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-touchstart-event-listener-on-root.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-touchstart-event-listener-on-window.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-wheel-event-listener-on-body.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-wheel-event-listener-on-div.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-wheel-event-listener-on-document.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-wheel-event-listener-on-root.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/non-passive-wheel-event-listener-on-window.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-mousewheel-event-listener-on-body.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-mousewheel-event-listener-on-div.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-mousewheel-event-listener-on-document.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-mousewheel-event-listener-on-root.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-mousewheel-event-listener-on-window.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-touchmove-event-listener-on-body.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-touchmove-event-listener-on-div.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-touchmove-event-listener-on-document.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-touchmove-event-listener-on-root.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-touchmove-event-listener-on-window.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-touchstart-event-listener-on-body.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-touchstart-event-listener-on-div.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-touchstart-event-listener-on-document.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-touchstart-event-listener-on-root.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-touchstart-event-listener-on-window.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-wheel-event-listener-on-body.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-wheel-event-listener-on-div.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-wheel-event-listener-on-document.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-wheel-event-listener-on-root.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/passive-wheel-event-listener-on-window.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/non-cancelable-when-passive/synthetic-events-cancelable.html | fail | assert_implements: WheelEvent should be supported undefined |
| /dom/events/passive-by-default-non-node.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/passive-by-default.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/pointer-event-document-move.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/preventDefault-during-activation-behavior.html | fail | assert_true: expected true got false |
| /dom/events/relatedTarget.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/events/scrolling/iframe-chains.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/input-text-scroll-event-when-using-arrow-keys.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/save-iframe-scroll-offset-when-display-none.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scroll-cross-origin-iframes.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scroll-event-fired-to-element.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scroll-event-fired-to-iframe.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scroll-event-not-fired-on-ancestor-style-change.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scroll-events-fired-once-per-frame-across-display-none.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollIntoView-in-onscroll-to-sticky.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fired-after-instant-scroll-in-microtask.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fired-after-layout-clamping.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fired-after-sequence-of-scrolls.tentative.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fired-after-snap.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fired-for-mandatory-snap-point-after-load.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fired-for-programmatic-scroll.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fired-for-scroll-attr-change.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fired-for-scrollIntoView.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fired-to-document.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fired-to-element-with-overscroll-behavior.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fired-to-window.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fires-for-repeat-key-ending-after-scroll-container-end-is-reached.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fires-on-visual-viewport.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-fires-to-iframe-window.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-for-user-scroll.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-handler-content-attributes.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-not-fired-after-removing-scroller.tentative.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-event-not-fired-on-no-scroll.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-fires-to-text-input.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/scrollend-with-snap-on-fractional-offset.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/visibility-hidden-scrolls.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/wheel-event-composed.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/wheel-event-no-scroll-after-prevent-default.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/wheel-event-transactions-basic.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/wheel-event-transactions-multiple-action-chains.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/wheel-event-transactions-target-display-change.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/wheel-event-transactions-target-elements.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/wheel-event-transactions-target-move.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/wheel-event-transactions-target-removal.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/scrolling/wheel-event-transactions-target-resize.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/shadow-relatedTarget.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/webkit-animation-end-event.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/webkit-animation-iteration-event.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/webkit-animation-start-event.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/webkit-transition-end-event.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/window-composed-path.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/events/window-event-restored-after-throwing-onerror.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/lists/DOMTokenList-coverage-for-attributes.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/lists/DOMTokenList-iteration.html | fail | assert_equals: Entry 0 listObj expected object "   a  a b " but got object "   a  a b " |
| /dom/lists/DOMTokenList-stringifier.html | fail | assert_class_string: expected "[object DOMTokenList]" but got "[object Object]" |
| /dom/lists/DOMTokenList-value.html | fail | assert_class_string: expected "[object DOMTokenList]" but got "[object Object]" |
| /dom/nodes/Attr-prefix-xhtml.xhtml | fail | assert_equals: Parser-inserted attribute with prefix: specified expected (boolean) true but got (undefined) undefined |
| /dom/nodes/Attr-prefix.html | fail | assert_equals: Parser-inserted attribute with prefix: specified expected (boolean) true but got (undefined) undefined |
| /dom/nodes/CharacterData-remove.html | fail | assert_array_equals: Parent should have two children left expected property 0 to be "present" but was "missing" (expected array [Comment node <!--before-->, Comment node <!--after-->] got object "[object Object]") |
| /dom/nodes/Comment-constructor.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/DOMImplementation-createDocument-no-browsing-context.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/DOMImplementation-createDocument.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/DOMImplementation-createHTMLDocument-with-saved-implementation.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/DOMImplementation-createHTMLDocument.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/DOMImplementation-hasFeature.html | fail | Cannot read properties of undefined (reading 'apply') |
| /dom/nodes/Document-URL.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-adoptNode-DocumentFragment-with-host.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/Document-base-url-not-live.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/Document-characterSet-normalization-1.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-characterSet-normalization-2.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-cloneNode-about-base-url-relative.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/Document-cloneNode-about-base-url.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/Document-cloneNode-base-url-xml.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/Document-cloneNode-base-url.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/Document-cloneNode-srcdoc-base-url.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/Document-constructor.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/contenttype_bmp.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/contenttype_css.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/contenttype_datauri_02.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/contenttype_gif.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/contenttype_html.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/contenttype_javascripturi.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/contenttype_jpg.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/contenttype_mimeheader_01.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/contenttype_mimeheader_02.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/contenttype_png.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/contenttype_txt.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/contenttype_xml.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-contentType/contentType/xhr_responseType_document.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-createAttribute.html | fail | assert_equals: specified expected (boolean) true but got (undefined) undefined |
| /dom/nodes/Document-createCDATASection-xhtml.xhtml | fail | c.hasChildNodes is not a function |
| /dom/nodes/Document-createComment.html | fail | c.hasChildNodes is not a function |
| /dom/nodes/Document-createElement-namespace.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-createElement.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-createElementNS.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-createEvent-touchevent.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/Document-createEvent.https.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-createTextNode.html | fail | c.hasChildNodes is not a function |
| /dom/nodes/Document-doctype.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Document-getElementsByTagName-xhtml.xhtml | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <I></I>] got object "[object Object]") |
| /dom/nodes/Document-getElementsByTagName.html | fail | assert_throws_js: function "function() {       "use strict";       l[5] = "foopy"     }" did not throw |
| /dom/nodes/Document-getElementsByTagNameNS.html | fail | assert_array_equals: lengths differ, expected array [] length 0, got object "[object Object]" length 2 |
| /dom/nodes/Document-implementation.html | fail | DOMImplementation is not defined |
| /dom/nodes/DocumentFragment-constructor.html | fail | assert_equals: expected Document node with 2 children but got Document node with 0 children |
| /dom/nodes/DocumentType-remove.html | fail | assert_array_equals: Parent should have two children left expected property 0 to be "present" but was "missing" (expected array [Comment node <!--before-->, Comment node <!--after-->] got object "[object Object]") |
| /dom/nodes/Element-children.html | fail | assert_true: Expected an Element. expected true got false |
| /dom/nodes/Element-classlist.html | fail | Cannot set property classList of #<Element> which has only a getter |
| /dom/nodes/Element-closest.html | fail | assert_equals: :invalid expected "test2" but got "" |
| /dom/nodes/Element-getElementsByClassName.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <b class="foo"></b>] got object "[object Object]") |
| /dom/nodes/Element-getElementsByTagName-change-document-HTMLNess.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Element-getElementsByTagName.html | fail | assert_throws_js: function "function() {       "use strict";       l[5] = "foopy"     }" did not throw |
| /dom/nodes/Element-getElementsByTagNameNS.html | fail | assert_array_equals: lengths differ, expected array [] length 0, got object "[object Object]" length 1 |
| /dom/nodes/Element-insertAdjacentElement.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Element-insertAdjacentText.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Element-matches-disabled-pseudo-class.html | fail | assert_true: expected true got false |
| /dom/nodes/Element-matches-namespaced-elements.html | fail | document.createElementNS(...)[method] is not a function |
| /dom/nodes/Element-matches.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Element-querySelectorAll-context-element.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <tr id="row"></tr>] got object "[object Object]") |
| /dom/nodes/Element-remove.html | fail | assert_array_equals: Parent should have two children left expected property 0 to be "present" but was "missing" (expected array [Comment node <!--before-->, Comment node <!--after-->] got object "[object Object]") |
| /dom/nodes/Element-removeAttributeNS.html | fail | assert_equals: specified expected (boolean) true but got (undefined) undefined |
| /dom/nodes/Element-tagName.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Element-webkitMatchesSelector.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/MutationObserver-attributes.html | fail | MutationObserver is not defined |
| /dom/nodes/MutationObserver-callback-arguments.html | fail | MutationObserver is not defined |
| /dom/nodes/MutationObserver-callback-order.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/MutationObserver-callback-tricky.html | fail | MutationObserver is not defined |
| /dom/nodes/MutationObserver-characterData.html | fail | MutationObserver is not defined |
| /dom/nodes/MutationObserver-childList.html | fail | MutationObserver is not defined |
| /dom/nodes/MutationObserver-cross-realm-callback-report-exception.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/MutationObserver-disconnect.html | fail | MutationObserver is not defined |
| /dom/nodes/MutationObserver-document.html | fail | MutationObserver is not defined |
| /dom/nodes/MutationObserver-inner-outer.html | fail | MutationObserver is not defined |
| /dom/nodes/MutationObserver-overlapping-registrations.html | fail | MutationObserver is not defined |
| /dom/nodes/MutationObserver-sanity.html | fail | MutationObserver is not defined |
| /dom/nodes/MutationObserver-takeRecords.html | fail | MutationObserver is not defined |
| /dom/nodes/MutationObserver-textContent.html | error | MutationObserver is not defined |
| /dom/nodes/MutationObserver-transient-registered-observers.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/MutationObserver-xml-parser.xhtml | error | MutationObserver is not defined |
| /dom/nodes/Node-appendChild-cereactions-vs-script.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/Node-appendChild.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Node-childNodes.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <p></p>] got object "[object Object]") |
| /dom/nodes/Node-cloneNode-document-allow-declarative-shadow-roots.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/Node-cloneNode-document-with-doctype.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Node-cloneNode-external-stylesheet-no-bc.sub.html | skip | host-unsupported: source requires WPT substitution preprocessing |
| /dom/nodes/Node-cloneNode.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Node-compareDocumentPosition.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Node-constants.html | fail | assert_true: Object [object Object] doesn't have ELEMENT_NODE expected true got false |
| /dom/nodes/Node-contains-xml.xml | fail | assert_throws_js: function "function() {     document.contains();   }" did not throw |
| /dom/nodes/Node-contains.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Node-insertBefore.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [DocumentType node, Element node <html><head><title>title</title></head><body></body></html>, Comment node <!--foo-->] got object "[object Object]") |
| /dom/nodes/Node-isConnected-shadow-dom.html | fail | host.attachShadow is not a function |
| /dom/nodes/Node-isConnected.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Node-isEqualNode-xhtml.xhtml | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Node-normalize.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Text node "", Text node "a", Text node ""] got object "[object Object]") |
| /dom/nodes/Node-parentNode.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Node-properties.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Node-removeChild.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Node-replaceChild.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [DocumentType node, Element node <html><head><title>title</title></head><body></body></html>, Comment node <!--foo-->] got object "[object Object]") |
| /dom/nodes/NodeList-Iterable.html | fail | assert_true: expected true got false |
| /dom/nodes/NodeList-live-mutations.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/ParentNode-append.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <x></x>] got object "[object Object]") |
| /dom/nodes/ParentNode-prepend.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <x></x>] got object "[object Object]") |
| /dom/nodes/ParentNode-properties.html | fail | Cannot read properties of undefined (reading 'length') |
| /dom/nodes/ParentNode-querySelector-All-scope.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <p><span>hello</span></p>, Element node <p id="p2">hey</p>] got object "[object Object]") |
| /dom/nodes/ParentNode-querySelector-All-xht.xht | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/ParentNode-querySelector-All.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/ParentNode-querySelector-case-insensitive.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <input name="User" id="testInput"></input>] got object "[object Object]") |
| /dom/nodes/ParentNode-querySelector-escapes.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/ParentNode-querySelector-host-pseudo-class.html | fail | section.attachShadow is not a function |
| /dom/nodes/ParentNode-querySelector-namespace-tagname-attribute.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/ParentNode-querySelector-scope.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <p><span>hello</span></p>] got object "[object Object]") |
| /dom/nodes/ParentNode-querySelector-shadowroot-nth-child.html | fail | hostElement.attachShadow is not a function |
| /dom/nodes/ParentNode-querySelector-tag-case.html | fail | assert_array_equals: Lowercase ul expected property 0 to be "present" but was "missing" (expected array [Element node <ul><li></li></ul>] got object "[object Object]") |
| /dom/nodes/ParentNode-querySelector-xml-capitalization.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/ParentNode-querySelectorAll-namespace.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/ParentNode-querySelectorAll-nested-not-has.html | fail | assert_array_equals: dd:not(:has(dd)) expected property 0 to be "present" but was "missing" (expected array [Element node <dd class="a" id="dd-a">A</dd>, Element node <dd class="c" id="dd-c">C</dd>, Element node <dd class="d" id="dd-d">D</dd>, Element node <dd class="e" id="dd-e">E</dd>] got object "[object Object]") |
| /dom/nodes/ParentNode-querySelectorAll-scope-colon-id-class.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <span id="targetSpan"></span>] got object "[object Object]") |
| /dom/nodes/ParentNode-querySelectors-namespaces.html | error | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <svg id="thesvg" xlink:href="foo"></svg>] got object "[object Object]") |
| /dom/nodes/ParentNode-querySelectors-space-and-dash-attribute-value.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <a title="test with - dash and space" id="testme">Test On...] got object "[object Object]") |
| /dom/nodes/ParentNode-replaceChildren.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <x></x>] got object "[object Object]") |
| /dom/nodes/ProcessingInstruction-escapes-1.xhtml | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/ProcessingInstruction-literal-2.xhtml | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/Text-constructor.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/adoption.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/append-on-Document.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <x></x>] got object "[object Object]") |
| /dom/nodes/attach-shadow-realm-after-adoption.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/attributes-namednodemap-cross-document.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/attributes-namednodemap.html | fail | Cannot read properties of undefined (reading 'value') |
| /dom/nodes/attributes.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/case.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <abc></abc>, Element node <abc></abc>, Element node <abc></abc>] got object "[object Object]") |
| /dom/nodes/create-element-realm-after-adoption.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/getElementById-namespaced-id.html | fail | assert_array_equals: lengths differ, expected array [Element node <input name="field" required="" form="owner"></input>] length 1, got [] length 0 |
| /dom/nodes/getElementsByClassName-01.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <html class="a"><head>   <title>document.getElementsByCla..., Element node <body class="a">   <div id="log"></div>   <script> test(f...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-02.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <html class="a b"><head>   <title>document.getElementsByC..., Element node <body class="a ">   <div id="log"></div>   <script> test(...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-03.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <html class="a"><head>   <title>document.getElementsByCla...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-04.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <html class="a"><head>   <title>document.getElementsByCla..., Element node <body class="a	b">   <div id="log"></div>   <script>    t...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-05.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <html class="a"><head>   <title>document.getElementsByCla...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-06.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <body class="a">   <div id="log"></div>   <script>    tes..., Element node <foo class="a"></foo>] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-07.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <body class="a b">   <div id="log"></div>   <script> test...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-08.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <body class="a">   <div id="log"></div>   <script>    tes...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-09.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <html class="a A"><head>   <title>document.getElementsByC...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-11.xml | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <x class="a"></x>, Element node <x class="a"></x>, Element node <x class="a" t:class="a" h:class="a" g:class="a"></x>] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-13.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <x-y-z class="a"></x-y-z>] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-14.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <html class="a A"><head>   <title>document.getElementsByC..., Element node <body class="a a">   <div id="log"></div>   <div class="k...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-15.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <html class="a b"><head>   <title>document.getElementsByC..., Element node <body class="a ">   <div id="log"></div>   <script>test(f...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-16.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <body class="b,a">   <div id="log"></div>   <script>test(...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-17.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <body class="a b">   <div id="log"></div>   <script>test(...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-18.htm | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <body class="a,b x">   <div id="log"></div>   <p id="r" c...] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-30.htm | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/getElementsByClassName-31.htm | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/getElementsByClassName-32.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <p class="first-p"></p>] got object "[object Object]") |
| /dom/nodes/getElementsByClassName-whitespace-class-names.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <span class="">LINE TABULATION</span>] got object "[object Object]") |
| /dom/nodes/insertion-removing-steps/Node-append-form-and-script-from-fragment.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/insertion-removing-steps/Node-append-meta-referrer-and-script-from-fragment.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-and-button-from-div.html | fail | assert_equals: expected Element node <form id="form"><div><script>     buttonForm = button.for... but got null |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-and-custom-from-fragment.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-and-default-style-meta-from-fragment.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-and-div-from-fragment.html | fail | assert_equals: expected Element node <head><meta charset="utf-8"> <title>Node.appendChild: ins... but got null |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-and-iframe.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-and-source-from-fragment.html | fail | assert_array_equals: lengths differ, expected array [3] length 1, got [] length 0 |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-and-style.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-in-script.html | fail | assert_array_equals: lengths differ, expected array ["s1", "s2", "s2ran"] length 3, got [] length 0 |
| /dom/nodes/insertion-removing-steps/Node-appendChild-script-with-mutation-observer-takeRecords.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/insertion-removing-steps/Node-appendChild-text-and-script-in-style.html | fail | assert_array_equals: lengths differ, expected array [2] length 1, got [] length 0 |
| /dom/nodes/insertion-removing-steps/Node-appendChild-text-in-script.html | fail | assert_array_equals: lengths differ, expected array ["t1", "t2"] length 2, got [] length 0 |
| /dom/nodes/insertion-removing-steps/Node-appendChild-three-scripts-from-fragment.html | fail | assert_array_equals: lengths differ, expected array ["s3", "s1", "s2"] length 3, got [] length 0 |
| /dom/nodes/insertion-removing-steps/Node-appendChild-three-scripts.html | fail | assert_array_equals: lengths differ, expected array ["s3", "s1", "s2"] length 3, got [] length 0 |
| /dom/nodes/insertion-removing-steps/blur-event.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/insertion-removing-steps/change-event.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/insertion-removing-steps/frame-post-connection-steps.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/insertion-removing-steps/insertion-removing-steps-iframe.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/insertion-removing-steps/insertion-removing-steps-script.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/insertion-removing-steps/later-script-removed-by-earlier-script.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/insertion-removing-steps/script-does-not-run-on-child-removal.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/live-collections-batched-mutations.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/moveBefore/Node-moveBefore.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/child-style-preserve.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/continue-css-animation-left.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/continue-css-animation-transform.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/continue-css-transition-left-pseudo.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/continue-css-transition-left.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/continue-css-transition-transform-pseudo.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/continue-css-transition-transform.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/css-animation-commit-styles.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/css-transition-cross-document.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/css-transition-cross-shadow.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/css-transition-to-disconnected-document.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/css-transition-trigger.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/custom-element-move-reactions.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/fieldset-child-blur-event.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/fieldset-child-date-input-blur-event.html | fail | victim is not defined |
| /dom/nodes/moveBefore/fire-focusin-focusout.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/focus-preserve.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/focus-within.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/fullscreen-preserve.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/hover-style-update.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/iframe-document-preserve.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/moveBefore/live-range-updates.html | fail | Range is not defined |
| /dom/nodes/moveBefore/modal-dialog.html | fail | assert_true: expected true got false |
| /dom/nodes/moveBefore/moveBefore-child-list-selector-invalidation.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/moveBefore-dir.html | fail | target is not defined |
| /dom/nodes/moveBefore/moveBefore-disconnected-id-map.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/moveBefore-from-light-to-shadow.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/moveBefore-id-map.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/moveBefore-into-display-none.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/moveBefore-lang.html | fail | target is not defined |
| /dom/nodes/moveBefore/moveBefore-name-map.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/moveBefore-optgroup.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/moveBefore-option-recalc-style.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/moveBefore-selector-matching.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/moveBefore-shadow-boundary-id-change.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/moveBefore-shadow-host-id-map.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/moveBefore-shadow-inside.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/moveBefore-shadow-root.html | fail | shadowTarget is not defined |
| /dom/nodes/moveBefore/moveBefore-size-query.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/mutation-observer-moved-subtree.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/nodes/moveBefore/mutation-observer.html | fail | promise_test: Unhandled rejection with value: object "ReferenceError: oldParent is not defined" |
| /dom/nodes/moveBefore/nonce.html | fail | new_parent is not defined |
| /dom/nodes/moveBefore/object-crash-regression.html | fail | p is not defined |
| /dom/nodes/moveBefore/pointer-events.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/popover-preserve.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/preserve-render-blocking-script.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/preserve-render-blocking-style.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/relevant-mutations.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/role-updates-after-move.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/script-move-before.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/select-option-optgroup.html | fail | assert_true: A STILL selected after it is moved out expected true got false |
| /dom/nodes/moveBefore/selection-preserve.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/slotchange-events.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/style-applies.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/stylesheet-cascade-order.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/stylesheet-no-refetch.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/moveBefore/throws-exception.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/name-validation.html | fail | assert_unreached: element.setAttributeNS should not have thrown an error for: code points: [115,109,97,108,108,69,109,111,106,105,55356,56726], string: "smallEmoji🆖" code points: [97,116,116,114], string: "attr" InvalidCharacterError: Invalid character in attribute name: smallEmoji🆖:attr Reached unreachable code |
| /dom/nodes/namespaced-attribute-mutations.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/node-creation-realm.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/node-realm-adoption-after-frame-removal.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/node-realm-mixed-across-adoption.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/node-realm-preserved-across-adoption.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/node-realm-preserved-across-frameless-adoption.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/post-connection-steps-shadow-tree.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/prepend-on-Document.html | fail | assert_array_equals: expected property 0 to be "present" but was "missing" (expected array [Element node <x></x>] got object "[object Object]") |
| /dom/nodes/processing-instruction-attributes.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/query-target-in-load-event.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/querySelector-empty-id.html | fail | root is not defined |
| /dom/nodes/querySelector-id-nth-child.html | fail | target is not defined |
| /dom/nodes/remove-and-adopt-thcrash.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/remove-next-sibling-during-replace-with.html | fail | target is not defined |
| /dom/nodes/remove-unscopable.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/nodes/rootNode.html | fail | shadowHost.attachShadow is not a function |
| /dom/ranges/Range-attribute-nodes.html | fail | Range is not defined |
| /dom/ranges/Range-cloneContents-around-shadow.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-cloneContents-around-shadow.tentative.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-cloneContents-in-ShadowRoot.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-cloneContents.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-cloneRange.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-collapse.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-commonAncestorContainer.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-compareBoundaryPoints.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-comparePoint.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-constructor.html | fail | Range is not defined |
| /dom/ranges/Range-deleteContents-around-shadow.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-deleteContents-around-shadow.tentative.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-deleteContents-in-ShadowRoot.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-deleteContents.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-expand-shadow.tentative.html | fail | range.expand is not a function |
| /dom/ranges/Range-extractContents-around-shadow.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-extractContents-around-shadow.tentative.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-extractContents-dynamic-end.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-extractContents-in-ShadowRoot.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-extractContents.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-in-shadow-after-the-shadow-removed.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-insertNode.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-intersectsNode-2.html | fail | Range is not defined |
| /dom/ranges/Range-intersectsNode-shadow.html | fail | host.attachShadow is not a function |
| /dom/ranges/Range-intersectsNode.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-isPointInRange.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-mutations-appendChild.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-mutations-appendData.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-mutations-dataChange.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-mutations-deleteData.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-mutations-insertBefore.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-mutations-insertData.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-mutations-removeChild.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-mutations-replaceChild.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-mutations-replaceData.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-mutations-splitText.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-selectNode.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-set.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/Range-stringifier.html | fail | Range is not defined |
| /dom/ranges/Range-surroundContents.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/StaticRange-constructor.html | fail | StaticRange is not defined |
| /dom/ranges/tentative/OpaqueRange-auto-disconnect.html | fail | el.createValueRange is not a function |
| /dom/ranges/tentative/OpaqueRange-basic.html | fail | textarea.createValueRange is not a function |
| /dom/ranges/tentative/OpaqueRange-disconnect.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-display-none.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-geometry-basic.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-geometry-complexity-and-visibility.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-geometry-multiline.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-geometry-mutations.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-highlight.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-highlightsFromPoint.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-interactive-basic.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-interactive-overlap-and-selection.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-offset.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-programmatic-updates.html | fail | element.createValueRange is not a function |
| /dom/ranges/tentative/OpaqueRange-range-updates.html | fail | textarea.createValueRange is not a function |
| /dom/ranges/tentative/OpaqueRange-supported-elements.html | fail | element.createValueRange is not a function |
| /dom/ranges/tentative/OpaqueRange-unsupported-elements.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-update-event-order.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/ranges/tentative/OpaqueRange-validation.html | fail | assert_throws_dom: function "() => textarea.createValueRange(10, 15)" threw object "TypeError: textarea.createValueRange is not a function" that is not a DOMException IndexSizeError: property "code" is equal to undefined, expected 1 |
| /dom/traversal/NodeIterator-removal.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/traversal/NodeIterator.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/traversal/TreeWalker-acceptNode-filter-cross-realm-null-browsing-context.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/traversal/TreeWalker-acceptNode-filter-cross-realm.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/traversal/TreeWalker-basic.html | fail | assert_equals: toString expected "[object TreeWalker]" but got "[object Object]" |
| /dom/traversal/TreeWalker-currentNode.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/traversal/TreeWalker-nextNode-detached-currentNode.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /dom/traversal/TreeWalker-realm.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /dom/traversal/TreeWalker.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/DOMParser-parseFromString-encoding.html | error | Error: assert_equals: the meta charset must be in effect, making the main document windows-1252 expected "windows-1252" but got "UTF-8" |
| /domparsing/DOMParser-parseFromString-html.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/DOMParser-parseFromString-stylesheets.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/DOMParser-parseFromString-url-base-about.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /domparsing/DOMParser-parseFromString-url-base-pushstate.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/DOMParser-parseFromString-url-base.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/DOMParser-parseFromString-url-moretests.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/DOMParser-parseFromString-url-pushstate.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/DOMParser-parseFromString-url.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/DOMParser-parseFromString-xml-CDATA.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/DOMParser-parseFromString-xml-scripting-support-disabled.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/DOMParser-parseFromString-xml.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/DOMParser-xml-character-entities.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/XMLSerializer-serializeToString.html | fail | assert_equals: expected "<html><head/><body><div/><span/></body></html>" but got "<html><head /><body><div /><span /></body></html>" |
| /domparsing/createContextualFragment-external-scripts-async.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/createContextualFragment-xhtml.xhtml | fail | assert_equals: expected "p" but got "body" |
| /domparsing/createContextualFragment.html | fail | assert_true: Fragment created and added to document, should run expected true got false |
| /domparsing/html-insertion-methods-html-element.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/html-unsafe-external-scripts-async.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/innerhtml-05.xhtml | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/innerhtml-07.html | fail | assert_equals: expected "" but got "null" |
| /domparsing/innerhtml-mxss.sub.html | skip | host-unsupported: source requires WPT substitution preprocessing |
| /domparsing/outerhtml-02.html | fail | assert_equals: expected "" but got "null" |
| /domparsing/outerhtml-03.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/parsed-document-origin.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /domparsing/positional-html-into-script-safe.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/positional-methods-with-parser-options.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/positional-methods-with-trusted-types-no-createParserOptions.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/positional-methods-with-trusted-types.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/positional-methods.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/positional-template-child.html | fail | assert_throws_dom: function "() => {             child[method_name]('<span></span>');           }" threw object "TypeError: child[method_name] is not a function" that is not a DOMException HierarchyRequestError: property "code" is equal to undefined, expected 3 |
| /domparsing/stream-html-reentrancy.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/style_attribute_html.html | fail | assert_equals: expected "color: red;" but got "" |
| /domparsing/tentative/all-stream-methods-with-trusted-types-no-policy.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-append-html-unsafe.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-append-html.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-fragment-context.html | fail | promise_test: Unhandled rejection with value: object "TypeError: table[method] is not a function" |
| /domparsing/tentative/stream-html-abort-unblocks-rendering.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-custom-element-sanitizer.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-custom-element.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-defer-async-script.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-element.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-parser-blocking-script.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-run-scripts-option.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-sanitizer-safe.html | fail | promise_test: Unhandled rejection with value: object "TypeError: target[prop] is not a function" |
| /domparsing/tentative/stream-html-sanitizer.html | fail | promise_test: Unhandled rejection with value: object "TypeError: placeholder[method] is not a function" |
| /domparsing/tentative/stream-html-script-safe.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-unsafe.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-with-declarative-shadow-root.html | fail | promise_test: Unhandled rejection with value: object "TypeError: ref_node[method] is not a function" |
| /domparsing/tentative/stream-html-with-trusted-types-adopt.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-with-trusted-types-createParserOptions-order.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-with-trusted-types-error-in-policy.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-with-trusted-types-from-non-tt.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-with-trusted-types-no-createParserOptions.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-with-trusted-types-no-policy.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-with-trusted-types-pass-trusted.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-with-trusted-types-runScripts-cannot-be-turned-on.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-with-trusted-types-runScripts-off.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html-with-trusted-types-sanitizer.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-html.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-insertion-logic.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-positional-template-child.html | fail | promise_test: Unhandled rejection with value: object "TypeError: child[method_name] is not a function" |
| /domparsing/tentative/stream-positional.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-sanitizer-customized-builtins.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-sanitizer-img-ctor.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-sanitizer-resource-fetch.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/stream-tokenizer-context.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/tentative/unclosed-script-already-started.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/unsafe-and-trusted-types-external-scripts-async.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /domparsing/xml-serialization.xhtml | fail | assert_equals: expected "<!DOCTYPE html PUBLIC \"\"\" \"\"\">" but got "<!DOCTYPE html PUBLIC '\"' '\"'>" |
| /html/dom/documents/dom-tree-accessors/Document.body.html | fail | assert_equals: expected null but got Element node <body></body> |
| /html/dom/documents/dom-tree-accessors/Document.currentScript.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/documents/dom-tree-accessors/document.embeds-document.plugins-01.html | fail | Cannot read properties of undefined (reading 'length') |
| /html/dom/documents/dom-tree-accessors/document.forms.html | fail | Cannot read properties of undefined (reading 'length') |
| /html/dom/documents/dom-tree-accessors/document.getElementsByName/document.getElementsByName-interface.html | fail | assert_class_string: expected "[object NodeList]" but got "[object Object]" |
| /html/dom/documents/dom-tree-accessors/document.head-02.html | fail | assert_equals: expected Element node <head></head> but got Element node <head></head> |
| /html/dom/documents/dom-tree-accessors/document.images.html | fail | Cannot read properties of undefined (reading 'length') |
| /html/dom/documents/dom-tree-accessors/document.links.html | fail | assert_true: expected true got false |
| /html/dom/documents/dom-tree-accessors/document.scripts.html | fail | assert_true: expected true got false |
| /html/dom/documents/dom-tree-accessors/nameditem-01.html | fail | assert_equals: expected (object) Element node <img id="a" name="b"></img> but got (undefined) undefined |
| /html/dom/documents/dom-tree-accessors/nameditem-02.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/documents/dom-tree-accessors/nameditem-04.html | fail | assert_true: "test1" in document should be true expected true got false |
| /html/dom/documents/dom-tree-accessors/nameditem-05.html | fail | assert_true: "test1" in document should be true expected true got false |
| /html/dom/documents/dom-tree-accessors/nameditem-06.html | fail | assert_true: "test1" in document should be true expected true got false |
| /html/dom/documents/dom-tree-accessors/nameditem-07.html | fail | assert_true: "test1" in document should be true expected true got false |
| /html/dom/documents/dom-tree-accessors/nameditem-08.html | fail | assert_true: expected true got false |
| /html/dom/documents/dom-tree-accessors/nameditem-adoption.html | fail | assert_equals: before adoption expected (object) Element node <object id="adopted"></object> but got (undefined) undefined |
| /html/dom/documents/dom-tree-accessors/nameditem-img-name-added-cached-list.html | fail | Cannot read properties of undefined (reading 'length') |
| /html/dom/documents/dom-tree-accessors/nameditem-img-name-added.html | fail | assert_equals: after adding a name expected (object) Element node <img id="bar" name="whatever"></img> but got (undefined) undefined |
| /html/dom/documents/dom-tree-accessors/nameditem-img-name-dynamic.html | fail | Cannot read properties of undefined (reading 'length') |
| /html/dom/documents/dom-tree-accessors/nameditem-img-name-removed.html | fail | Cannot read properties of undefined (reading 'length') |
| /html/dom/documents/dom-tree-accessors/nameditem-insertion-attr-mutation.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/documents/dom-tree-accessors/nameditem-names.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/documents/dom-tree-accessors/nameditem-no-shadowing.tentative.html | fail | HTMLDocument is not defined |
| /html/dom/documents/dom-tree-accessors/nameditem-setattribute-attr-mutation.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/documents/dom-tree-accessors/nameditem-supported-property-names-order.html | fail | assert_array_equals: lengths differ, expected array ["id-value", "name-value"] length 2, got [] length 0 |
| /html/dom/documents/dom-tree-accessors/nameditem-tree-order.html | fail | Cannot read properties of undefined (reading 'length') |
| /html/dom/documents/dom-tree-accessors/nameditem-tree-transitions.html | fail | collection is not iterable |
| /html/dom/elements/elements-in-the-dom/click-in-progress-flag.html | fail | assert_array_equals: lengths differ, expected array ["click"] length 1, got ["click", "click"] length 2 |
| /html/dom/elements/global-attributes/cdata-dir_auto.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/custom-attrs.html | fail | assert_equals: expected 3 but got 2 |
| /html/dom/elements/global-attributes/dataset-binding.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /html/dom/elements/global-attributes/dataset-delete.html | fail | Invalid dataset property name |
| /html/dom/elements/global-attributes/dataset-get-invalid-names.html | fail | Invalid dataset property name |
| /html/dom/elements/global-attributes/dataset-get.html | fail | assert_true: expected true got false |
| /html/dom/elements/global-attributes/dataset-prototype.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/dataset.html | fail | assert_true: expected true got false |
| /html/dom/elements/global-attributes/dir-assorted.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /html/dom/elements/global-attributes/dir-auto-div-append-child.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/dir-auto-dynamic-changes.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /html/dom/elements/global-attributes/dir-auto-form-associated.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /html/dom/elements/global-attributes/dir-bdi-script.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/dir-not-changed-text-input-typing.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/dir-slots-directionality.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/document-dir.html | fail | assert_equals: expected (string) "ltr" but got (undefined) undefined |
| /html/dom/elements/global-attributes/id-attribute.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/lang-attribute-document-element-replacement.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/lang-attribute-shadow.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /html/dom/elements/global-attributes/lang-attribute.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /html/dom/elements/global-attributes/mapped-attribute-adopt-001.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-lang-attribute-001.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-lang-attribute-002.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-lang-attribute-003.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-lang-attribute-004.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-lang-attribute-005.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-lang-attribute-006.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-lang-attribute-007.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-lang-attribute-008.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-lang-attribute-009.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-lang-attribute-010.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-lang-attribute-011.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-translate-attribute-007.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-translate-attribute-008.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-translate-attribute-009.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-translate-attribute-010.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-translate-attribute-011.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/the-translate-attribute-012.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/global-attributes/translate-inherit-no-parent-element.html | fail | myElement.attachShadow is not a function |
| /html/dom/elements/images/bypass-cache-revalidation.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/name-content-attribute-and-property.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/the-innertext-and-outertext-properties/dynamic-getter.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/the-innertext-and-outertext-properties/getter-first-letter-marker-multicol.html | fail | item is not defined |
| /html/dom/elements/the-innertext-and-outertext-properties/getter.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-setter.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-whitespace-pre-line.html | fail | a is not defined |
| /html/dom/elements/the-innertext-and-outertext-properties/innertext-with-white-spaces.html | skip | browser-profile-only: source requires Window, layout, navigation, or network |
| /html/dom/elements/the-innertext-and-outertext-properties/multiple-text-nodes.window.js | skip | browser-profile-only: generated source requires a Window or Worker global |
| /html/dom/elements/the-innertext-and-outertext-properties/outertext-setter.html | fail | assert_equals: It got merged with the previous text node expected 1 but got 2 |
