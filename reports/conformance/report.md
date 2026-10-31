# Conformance report

Run status: passed

## Suite totals

| Suite | Total | Pass | Fail | Unsupported | Skip | Error | Timeout | Pass rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| All | 10957 | 10945 | 0 | 6 | 6 | 0 | 0 | 99.89% |
| html5lib-tokenizer | 7053 | 7047 | 0 | 0 | 6 | 0 | 0 | 99.91% |
| html5lib-tree-construction | 3904 | 3898 | 0 | 6 | 0 | 0 | 0 | 99.85% |

## Profile totals

| Suite | Profile | Total | Pass | Fail | Unsupported | Skip | Error | Timeout | Pass rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| html5lib-tokenizer | CDATA section state | 56 | 56 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| html5lib-tokenizer | Data state | 6711 | 6705 | 0 | 0 | 6 | 0 | 0 | 99.91% |
| html5lib-tokenizer | PLAINTEXT state | 52 | 52 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| html5lib-tokenizer | RAWTEXT state | 71 | 71 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| html5lib-tokenizer | RCDATA state | 74 | 74 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| html5lib-tokenizer | Script data state | 89 | 89 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| html5lib-tree-construction | document | 3492 | 3486 | 0 | 6 | 0 | 0 | 0 | 99.83% |
| html5lib-tree-construction | fragment | 412 | 412 | 0 | 0 | 0 | 0 | 0 | 100.00% |

## Non-passing cases

| Suite | Profile | File | Line | Classification | Reason |
| --- | --- | --- | ---: | --- | --- |
| html5lib-tokenizer | Data state | domjs.test | 3 | skip | The fixture expects the parse error from before processing-instruction states were added and does not match the current HTML tokenizer algorithm. |
| html5lib-tokenizer | Data state | domjs.test | 11 | skip | The fixture expects the parse error from before processing-instruction states were added and does not match the current HTML tokenizer algorithm. |
| html5lib-tokenizer | Data state | domjs.test | 19 | skip | The fixture expects the parse error from before processing-instruction states were added and does not match the current HTML tokenizer algorithm. |
| html5lib-tokenizer | Data state | xmlViolation.test | 3 | skip | The fixture expects output after applying Coercing an HTML DOM into an infoset, not the tokenizer tokens themselves. |
| html5lib-tokenizer | Data state | xmlViolation.test | 7 | skip | The fixture expects output after applying Coercing an HTML DOM into an infoset, not the tokenizer tokens themselves. |
| html5lib-tokenizer | Data state | xmlViolation.test | 11 | skip | The fixture expects output after applying Coercing an HTML DOM into an infoset, not the tokenizer tokens themselves. |
| html5lib-tree-construction | document | scripted_adoption01.dat | 1 | unsupported | The fixture requires executing script during tree construction. |
| html5lib-tree-construction | document | scripted_ark.dat | 1 | unsupported | The fixture requires executing script during tree construction. |
| html5lib-tree-construction | document | scripted_foster01.dat | 1 | unsupported | The fixture requires executing script during tree construction. |
| html5lib-tree-construction | document | scripted_foster01.dat | 12 | unsupported | The fixture requires executing script during tree construction. |
| html5lib-tree-construction | document | scripted_webkit01.dat | 1 | unsupported | The fixture requires executing script during tree construction. |
| html5lib-tree-construction | document | scripted_webkit01.dat | 14 | unsupported | The fixture requires executing script during tree construction. |
