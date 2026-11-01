# Conformance report

Run status: passed

## Suite totals

| Suite | Total | Pass | Fail | Unsupported | Skip | Error | Timeout | Pass rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| All | 13384 | 12664 | 0 | 320 | 400 | 0 | 0 | 94.62% |
| html5lib-tokenizer | 7053 | 7047 | 0 | 0 | 6 | 0 | 0 | 99.91% |
| html5lib-tree-construction | 3904 | 3898 | 0 | 6 | 0 | 0 | 0 | 99.85% |
| w3c-xml-parser | 2427 | 1719 | 0 | 314 | 394 | 0 | 0 | 70.83% |

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
| w3c-xml-parser | namespaces-1.0-third-edition | 51 | 48 | 0 | 0 | 3 | 0 | 0 | 94.12% |
| w3c-xml-parser | namespaces-1.1 | 8 | 0 | 0 | 8 | 0 | 0 | 0 | 0.00% |
| w3c-xml-parser | xml-1.0-fifth-edition | 2102 | 1671 | 0 | 40 | 391 | 0 | 0 | 79.50% |
| w3c-xml-parser | xml-1.1 | 266 | 0 | 0 | 266 | 0 | 0 | 0 | 0.00% |

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
| w3c-xml-parser | namespaces-1.0-third-edition | eduni/namespaces/1.0/004.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | namespaces-1.0-third-edition | eduni/namespaces/1.0/005.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | namespaces-1.0-third-edition | eduni/namespaces/1.0/006.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | namespaces-1.1 | eduni/namespaces/1.1/001.xml | 1 | unsupported | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | eduni/namespaces/1.1/002.xml | 1 | unsupported | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | eduni/namespaces/1.1/003.xml | 1 | unsupported | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | eduni/namespaces/1.1/004.xml | 1 | unsupported | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | eduni/namespaces/1.1/005.xml | 1 | unsupported | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | eduni/namespaces/1.1/006.xml | 1 | unsupported | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | eduni/namespaces/1.1/007.xml | 1 | unsupported | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | eduni/namespaces/1.1/008.xml | 1 | unsupported | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-2e/E27.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-2e/E34.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-2e/E38.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-2e/E50.xml | 1 | unsupported | XML 1.1 / XML1.0-errata2e is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-2e/E55.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-2e/E57.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/008.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm04an21.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm04an22.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm04an23.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm04an24.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm04n21.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm04n22.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm04n23.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm04n24.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm04v01.xml | 1 | unsupported | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm05v01.xml | 1 | unsupported | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm05v02.xml | 1 | unsupported | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm05v03.xml | 1 | unsupported | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/ibm05v05.xml | 1 | unsupported | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/incl8bomboom.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/inclbomboom_be.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/errata-4e/inclbomboom_le.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/misc/007.xml | 1 | unsupported | The fixture tests byte encoding and its XML declaration, which is not observable through DOMParser string input. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/misc/008.xml | 1 | unsupported | The fixture tests byte encoding and its XML declaration, which is not observable through DOMParser string input. |
| w3c-xml-parser | xml-1.0-fifth-edition | eduni/misc/009.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-16be: The encoded data was not valid for encoding utf-16be |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/invalid/P58/ibm58i01.xml | 1 | unsupported | The DOMParser string adapter cannot decode raw: The "raw" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/invalid/P58/ibm58i02.xml | 1 | unsupported | The DOMParser string adapter cannot decode raw: The "raw" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/invalid/P68/ibm68i01.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/invalid/P68/ibm68i02.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/invalid/P68/ibm68i03.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/invalid/P68/ibm68i04.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/invalid/P69/ibm69i01.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/invalid/P69/ibm69i02.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/invalid/P69/ibm69i03.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/invalid/P69/ibm69i04.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P02/ibm02n30.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P02/ibm02n31.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P30/ibm30n01.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P31/ibm31n01.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P32/ibm32n09.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P61/ibm61n01.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P62/ibm62n01.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P62/ibm62n02.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P62/ibm62n03.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P62/ibm62n04.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P62/ibm62n05.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P62/ibm62n06.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P62/ibm62n07.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P62/ibm62n08.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P63/ibm63n01.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P63/ibm63n02.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P63/ibm63n03.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P63/ibm63n04.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P63/ibm63n05.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P63/ibm63n06.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P63/ibm63n07.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P64/ibm64n01.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P64/ibm64n02.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P64/ibm64n03.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P65/ibm65n01.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P65/ibm65n02.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P68/ibm68n06.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P69/ibm69n05.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P77/ibm77n01.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P77/ibm77n02.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P77/ibm77n03.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P77/ibm77n04.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P78/ibm78n01.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P78/ibm78n02.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P79/ibm79n01.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P79/ibm79n02.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P81/ibm81n01.xml | 1 | unsupported | The DOMParser string adapter cannot decode _UTF-8: The "_UTF-8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P81/ibm81n02.xml | 1 | unsupported | The DOMParser string adapter cannot decode -UTF-8: The "-UTF-8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P81/ibm81n03.xml | 1 | unsupported | The DOMParser string adapter cannot decode .UTF-8: The ".UTF-8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P81/ibm81n04.xml | 1 | unsupported | The DOMParser string adapter cannot decode 8-UTF: The "8-UTF" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P81/ibm81n05.xml | 1 | unsupported | The DOMParser string adapter cannot decode UTF~8: The "UTF~8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P81/ibm81n06.xml | 1 | unsupported | The DOMParser string adapter cannot decode UTF#8: The "UTF#8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P81/ibm81n07.xml | 1 | unsupported | The DOMParser string adapter cannot decode UTF:8: The "UTF:8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P81/ibm81n08.xml | 1 | unsupported | The DOMParser string adapter cannot decode UTF/8: The "UTF/8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P81/ibm81n09.xml | 1 | unsupported | The DOMParser string adapter cannot decode UTF;8: The "UTF;8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n03.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n04.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n05.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n06.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n07.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n08.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n09.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n10.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n100.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n101.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n102.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n103.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n104.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n105.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n106.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n107.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n108.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n109.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n11.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n110.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n111.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n112.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n113.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n114.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n115.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n116.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n117.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n118.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n119.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n12.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n120.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n121.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n122.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n123.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n124.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n125.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n126.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n127.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n128.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n129.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n13.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n130.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n131.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n132.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n133.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n134.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n135.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n136.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n137.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n138.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n139.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n14.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n140.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n141.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n142.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n143.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n144.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n145.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n146.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n147.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n148.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n149.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n15.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n150.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n151.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n152.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n153.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n154.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n155.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n156.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n157.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n158.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n159.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n16.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n160.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n161.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n162.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n163.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n164.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n165.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n166.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n167.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n168.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n169.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n17.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n170.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n171.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n172.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n173.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n174.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n175.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n176.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n177.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n178.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n179.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n18.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n180.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n181.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n182.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n183.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n184.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n185.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n186.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n187.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n188.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n189.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n19.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n190.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n191.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n192.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n193.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n194.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n195.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n196.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n197.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n198.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n20.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n21.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n22.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n23.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n24.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n25.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n26.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n27.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n28.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n29.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n30.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n31.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n32.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n33.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n34.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n35.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n36.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n37.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n38.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n39.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n40.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n41.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n42.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n43.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n44.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n45.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n46.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n47.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n48.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n49.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n50.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n51.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n52.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n53.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n54.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n55.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n56.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n57.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n58.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n59.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n60.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n61.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n62.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n63.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n64.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n65.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n66.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n67.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n68.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n69.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n70.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n71.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n72.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n73.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n74.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n75.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n76.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n77.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n78.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n79.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n80.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n81.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n82.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n83.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n84.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n85.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n86.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n87.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n88.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n89.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n90.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n91.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n92.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n93.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n94.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n95.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n96.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n97.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n98.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P85/ibm85n99.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P86/ibm86n01.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P86/ibm86n02.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P86/ibm86n03.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P86/ibm86n04.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n01.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n02.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n03.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n04.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n05.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n06.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n07.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n08.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n09.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n10.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n11.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n12.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n13.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n14.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n15.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n16.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n17.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n18.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n19.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n20.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n21.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n22.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n23.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n24.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n25.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n26.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n27.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n28.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n29.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n30.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n31.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n32.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n33.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n34.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n35.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n36.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n37.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n38.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n39.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n40.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n41.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n42.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n43.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n44.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n45.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n46.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n47.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n48.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n49.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n50.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n51.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n52.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n53.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n54.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n55.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n56.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n57.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n58.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n59.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n60.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n61.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n62.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n63.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n64.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n66.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n67.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n68.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n69.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n70.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n71.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n72.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n73.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n74.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n75.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n76.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n77.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n78.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n79.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n80.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n81.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n82.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n83.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n84.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P87/ibm87n85.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n03.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n04.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n05.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n06.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n08.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n09.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n10.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n11.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n12.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n13.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n14.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n15.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P88/ibm88n16.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P89/ibm89n03.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P89/ibm89n04.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P89/ibm89n05.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P89/ibm89n06.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P89/ibm89n07.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P89/ibm89n08.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P89/ibm89n09.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P89/ibm89n10.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P89/ibm89n11.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/P89/ibm89n12.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/not-wf/p28a/ibm28an01.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm/valid/P58/ibm58v02.xml | 1 | unsupported | The DOMParser string adapter cannot decode base64: The "base64" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | japanese/pr-xml-euc-jp.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | japanese/pr-xml-iso-2022-jp.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | japanese/pr-xml-little-endian.xml | 1 | unsupported | The fixture tests byte encoding and its XML declaration, which is not observable through DOMParser string input. |
| w3c-xml-parser | xml-1.0-fifth-edition | japanese/pr-xml-shift_jis.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | japanese/pr-xml-utf-16.xml | 1 | unsupported | The fixture tests byte encoding and its XML declaration, which is not observable through DOMParser string input. |
| w3c-xml-parser | xml-1.0-fifth-edition | japanese/weekly-euc-jp.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | japanese/weekly-iso-2022-jp.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | japanese/weekly-shift_jis.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p04pass1.xml | 1 | unsupported | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p05pass1.xml | 1 | unsupported | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p09fail1.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p09fail2.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p11pass1.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p30fail1.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p31fail1.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p61fail1.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p62fail1.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p62fail2.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p63fail1.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p63fail2.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p64fail1.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | oasis/p64fail2.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/ext-sa/001.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/ext-sa/002.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/ext-sa/003.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/not-sa/001.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/not-sa/003.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/not-sa/004.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/not-sa/005.xml | 1 | skip | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/not-sa/006.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/not-sa/007.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/not-sa/008.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/not-sa/009.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/sa/082.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/sa/140.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/sa/141.xml | 1 | skip | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/sa/168.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/sa/169.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/sa/170.xml | 1 | unsupported | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/not-wf/sa/185.xml | 1 | skip | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | xmltest/valid/sa/012.xml | 1 | unsupported | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/001.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/002.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/003.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/004.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/005.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/006.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/007.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/008.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/009.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/010.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/011.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/012.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/013.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/014.xml | 1 | unsupported | XML 1.0 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/015.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/016.xml | 1 | unsupported | XML 1.0 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/017.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/018.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/019.xml | 1 | unsupported | XML 1.0 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/020.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/021.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/022.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/023.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/024.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/025.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/026.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/027.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/028.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/029.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/030.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/031.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/032.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/033.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/034.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/035.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/036.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/037.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/038.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/039.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/040.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/041.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/042.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/043.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/044.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/045.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/046.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/047.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/048.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/049.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/050.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/051.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/052.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/053.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/054.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/055.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/056.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | eduni/xml-1.1/057.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/invalid/P46/ibm46i01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/invalid/P46/ibm46i02.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n02.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n03.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n04.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n05.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n06.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n07.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n08.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n09.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n10.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n11.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n12.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n13.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n14.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n15.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n16.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n17.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n18.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n19.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n20.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n21.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n22.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n23.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n24.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n25.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n26.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n27.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n28.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n29.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n30.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n31.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n32.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n33.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n34.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n35.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n36.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n37.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n38.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n39.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n40.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n41.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n42.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n43.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n44.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n45.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n46.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n47.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n48.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n49.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n50.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n51.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n52.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n53.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n54.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n55.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n56.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n57.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n58.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n59.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n60.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n61.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n62.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n63.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n64.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n65.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n66.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n67.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n68.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n69.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n70.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P02/ibm02n71.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n02.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n03.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n04.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n05.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n06.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n07.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n08.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n09.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n10.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n11.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n12.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n13.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n14.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n15.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n16.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n17.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n18.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n19.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n20.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n21.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n22.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n23.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n24.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n25.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n26.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n27.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04/ibm04n28.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an02.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an03.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an04.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an05.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an06.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an07.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an08.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an09.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an10.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an11.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an12.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an13.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an14.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an15.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an16.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an17.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an18.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an19.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an20.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an21.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an22.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an23.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an24.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an25.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an26.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an27.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P04a/ibm04an28.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P05/ibm05n01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P05/ibm05n02.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P05/ibm05n03.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P05/ibm05n04.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P05/ibm05n05.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P05/ibm05n06.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n02.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n03.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n04.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n05.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n06.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n07.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n08.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n09.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n10.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n11.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n12.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n13.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n14.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n15.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n16.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n17.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n18.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n19.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n20.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/not-wf/P77/ibm77n21.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P02/ibm02v01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P02/ibm02v02.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P02/ibm02v03.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P02/ibm02v04.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P02/ibm02v05.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P02/ibm02v06.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P03/ibm03v01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P03/ibm03v02.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P03/ibm03v03.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P03/ibm03v04.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P03/ibm03v05.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P03/ibm03v06.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P03/ibm03v07.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P03/ibm03v08.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P03/ibm03v09.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P04/ibm04v01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P04a/ibm04av01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P05/ibm05v01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P05/ibm05v02.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P05/ibm05v03.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P05/ibm05v04.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P05/ibm05v05.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P07/ibm07v01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v01.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v02.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v03.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v04.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v05.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v06.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v07.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v08.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v09.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v10.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v11.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v12.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v13.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v14.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v15.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v16.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v17.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v18.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v19.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v20.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v21.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v22.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v23.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v24.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v25.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v26.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v27.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v28.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v29.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm/xml-1.1/valid/P77/ibm77v30.xml | 1 | unsupported | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
