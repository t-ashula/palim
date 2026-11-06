# WPT progress report

Run status: failed

Source: wpt/wpt@4fa34c721570cad34ee7283bf531811eafed6010

## URL progress

| Area | Total | Executed | Pass | Fail | Skip | Error | Timeout | Pending | Progress | Pass rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| All | 18 | 18 | 6 | 12 | 0 | 0 | 0 | 0 | 100.00% | 33.33% |
| /dom/abort/ | 4 | 4 | 0 | 4 | 0 | 0 | 0 | 0 | 100.00% | 0.00% |
| /dom/events/ | 9 | 9 | 5 | 4 | 0 | 0 | 0 | 0 | 100.00% | 55.56% |
| /dom/lists/ | 5 | 5 | 1 | 4 | 0 | 0 | 0 | 0 | 100.00% | 20.00% |

## Executed subtests

| Total | Pass | Fail | Skip | Error | Timeout | Pass rate |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 265 | 189 | 76 | 0 | 0 | 0 | 71.32% |

## Non-passing executed tests

| URL | Status | Message |
| --- | --- | --- |
| /dom/abort/AbortSignal.any.js | fail | AbortSignal.abort is not a function |
| /dom/abort/abort-signal-any.any.js | fail | signalInterface.any is not a function |
| /dom/abort/event.any.js | fail | assert_true: event should be trusted expected true got false |
| /dom/abort/timeout.any.js | fail | AbortSignal.timeout is not a function |
| /dom/events/AddEventListenerOptions-passive.any.js | fail | assert_true: addEventListener doesn't support the passive option expected true got false |
| /dom/events/Event-constructors.any.js | fail | assert_throws_js: function "function() {     new Event()   }" did not throw |
| /dom/events/Event-isTrusted.any.js | fail | assert_equals: expected "function" but got "undefined" |
| /dom/events/EventTarget-constructible.any.js | fail | assert_array_equals: lengths differ, expected array [] length 0, got [object "[object Object]"] length 1 |
| /dom/lists/DOMTokenList-coverage-for-attributes.html | fail | assert_class_string: expected "[object DOMTokenList]" but got "[object Object]" |
| /dom/lists/DOMTokenList-iteration.html | fail | assert_equals: Entry 0 listObj expected object "   a  a b " but got object "   a  a b " |
| /dom/lists/DOMTokenList-stringifier.html | fail | assert_class_string: expected "[object DOMTokenList]" but got "[object Object]" |
| /dom/lists/DOMTokenList-value.html | fail | assert_class_string: expected "[object DOMTokenList]" but got "[object Object]" |
