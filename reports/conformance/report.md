# Conformance report

Run status: failed

## Suite totals

| Suite | Total | Pass | Fail | Unsupported | Skip | Error | Timeout | Pass rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| All | 17884 | 17163 | 0 | 320 | 400 | 0 | 1 | 95.97% |
| html5lib-tokenizer | 7053 | 7047 | 0 | 0 | 6 | 0 | 0 | 99.91% |
| html5lib-tree-construction | 3904 | 3898 | 0 | 6 | 0 | 0 | 0 | 99.85% |
| readability | 128 | 127 | 0 | 0 | 0 | 0 | 1 | 99.22% |
| w3c-xml-parser | 2427 | 1719 | 0 | 314 | 394 | 0 | 0 | 70.83% |
| wpt-url-constructor | 897 | 897 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| wpt-url-idna | 2782 | 2782 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| wpt-url-origin | 415 | 415 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| wpt-url-setters | 278 | 278 | 0 | 0 | 0 | 0 | 0 | 100.00% |

## Suite sources

| Suite | Fixture | Revision | Implementation | Version | Integrity |
| --- | --- | --- | --- | --- | --- |
| html5lib-tokenizer | html5lib/html5lib-tests | c777c408b61078ea2eb4acefc2535f54dbc8b28a |  |  |  |
| html5lib-tree-construction | wpt/wpt | 4fa34c721570cad34ee7283bf531811eafed6010 |  |  |  |
| readability | readability/readability | 04fd32f72b448c12b02ba6c40928b67e510bac49 | @mozilla/readability | 0.6.0 | sha512-juG5VWh4qAivzTAeMzvY9xs9HY5rAcr2E4I7tiSSCokRFi7XIZCAu92ZkSTsIj1OPceCifL3cpfteP3pDT9/QQ== |
| w3c-xml-parser | w3c/xml-test-suite | 20130923 |  |  |  |
| wpt-url-constructor | wpt/wpt | 4fa34c721570cad34ee7283bf531811eafed6010 |  |  |  |
| wpt-url-idna | wpt/wpt | 4fa34c721570cad34ee7283bf531811eafed6010 |  |  |  |
| wpt-url-origin | wpt/wpt | 4fa34c721570cad34ee7283bf531811eafed6010 |  |  |  |
| wpt-url-setters | wpt/wpt | 4fa34c721570cad34ee7283bf531811eafed6010 |  |  |  |

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
| readability | text/html | 128 | 127 | 0 | 0 | 0 | 0 | 1 | 99.22% |
| w3c-xml-parser | namespaces-1.0-third-edition | 51 | 48 | 0 | 0 | 3 | 0 | 0 | 94.12% |
| w3c-xml-parser | namespaces-1.1 | 8 | 0 | 0 | 8 | 0 | 0 | 0 | 0.00% |
| w3c-xml-parser | xml-1.0-fifth-edition | 2102 | 1671 | 0 | 40 | 391 | 0 | 0 | 79.50% |
| w3c-xml-parser | xml-1.1 | 266 | 0 | 0 | 266 | 0 | 0 | 0 | 0.00% |
| wpt-url-constructor | url | 897 | 897 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| wpt-url-idna | url | 2782 | 2782 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| wpt-url-origin | url | 415 | 415 | 0 | 0 | 0 | 0 | 0 | 100.00% |
| wpt-url-setters | url | 278 | 278 | 0 | 0 | 0 | 0 | 0 | 100.00% |

## Failure kinds

None.

## Errors

| Suite | Name | Message | Count |
| --- | --- | --- | ---: |
| readability | TimeoutError | Readability case timed out after 30000 ms | 1 |

## Non-passing cases

| Suite | Profile | Case ID | File | Line | Classification | Failure kind | Errors | Reason |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| html5lib-tokenizer | Data state | bd0e46e6e8d7d619b48d216d4fb1a411d8c7ba0f3021e70e93c0f122c06d19be | domjs.test | 3 | skip |  |  | The fixture expects the parse error from before processing-instruction states were added and does not match the current HTML tokenizer algorithm. |
| html5lib-tokenizer | Data state | 5faab453628218551d267c93d4e0d539f8afdf330d2dde8ee5883768c07221d6 | domjs.test | 11 | skip |  |  | The fixture expects the parse error from before processing-instruction states were added and does not match the current HTML tokenizer algorithm. |
| html5lib-tokenizer | Data state | 2dafa2280fcd2eabd9a92da056068b1431bf3036ce6857acdd5e66ddb816760f | domjs.test | 19 | skip |  |  | The fixture expects the parse error from before processing-instruction states were added and does not match the current HTML tokenizer algorithm. |
| html5lib-tokenizer | Data state | e86f73b07553153fb88073cf641e5fac0a8af79bd8f501eac6697f96544757e7 | xmlViolation.test | 3 | skip |  |  | The fixture expects output after applying Coercing an HTML DOM into an infoset, not the tokenizer tokens themselves. |
| html5lib-tokenizer | Data state | cfa1eea9521bbb24d4f2d62f97697baf8f855b55abfe8f3e3d38312c79effe16 | xmlViolation.test | 7 | skip |  |  | The fixture expects output after applying Coercing an HTML DOM into an infoset, not the tokenizer tokens themselves. |
| html5lib-tokenizer | Data state | 609f416545ac5b8bf017df13ba41f431555c4dea933ac96ffb0a74636c5606a1 | xmlViolation.test | 11 | skip |  |  | The fixture expects output after applying Coercing an HTML DOM into an infoset, not the tokenizer tokens themselves. |
| html5lib-tree-construction | document | 3669d5990ac8f84c45569e8ef3ccf0509ead155265edb801423f995879f256e4 | scripted_adoption01.dat | 1 | unsupported |  |  | The fixture requires executing script during tree construction. |
| html5lib-tree-construction | document | 24ae5777d69c9057f81ac70cb4cabc64f60b8edb1943d0aaafef8e10c4218d9c | scripted_ark.dat | 1 | unsupported |  |  | The fixture requires executing script during tree construction. |
| html5lib-tree-construction | document | 137c8e00641691ab75d2b4e5e339c748a09a79558fd69b09c2b75105041824b3 | scripted_foster01.dat | 1 | unsupported |  |  | The fixture requires executing script during tree construction. |
| html5lib-tree-construction | document | 83e6ba1440d5f2117a8178d0e72f56707df024556524384f0ea4bd44c0d8773b | scripted_foster01.dat | 12 | unsupported |  |  | The fixture requires executing script during tree construction. |
| html5lib-tree-construction | document | 10e9a03eeca440ffbff3357fb7fafc7634bbd5782a02a2efb36101c613e9c8f6 | scripted_webkit01.dat | 1 | unsupported |  |  | The fixture requires executing script during tree construction. |
| html5lib-tree-construction | document | 6fe1aab417068dc47c259292d486d20c4e21c8a1138c0277e10ada675a7db708 | scripted_webkit01.dat | 14 | unsupported |  |  | The fixture requires executing script during tree construction. |
| readability | text/html | wikipedia-2 | wikipedia-2/source.html |  | timeout |  | TimeoutError: Readability case timed out after 30000 ms |  |
| w3c-xml-parser | namespaces-1.0-third-edition | rmt-ns10-004 | eduni/namespaces/1.0/004.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | namespaces-1.0-third-edition | rmt-ns10-005 | eduni/namespaces/1.0/005.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | namespaces-1.0-third-edition | rmt-ns10-006 | eduni/namespaces/1.0/006.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | namespaces-1.1 | rmt-ns11-001 | eduni/namespaces/1.1/001.xml | 1 | unsupported |  |  | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | rmt-ns11-002 | eduni/namespaces/1.1/002.xml | 1 | unsupported |  |  | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | rmt-ns11-003 | eduni/namespaces/1.1/003.xml | 1 | unsupported |  |  | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | rmt-ns11-004 | eduni/namespaces/1.1/004.xml | 1 | unsupported |  |  | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | rmt-ns11-005 | eduni/namespaces/1.1/005.xml | 1 | unsupported |  |  | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | rmt-ns11-006 | eduni/namespaces/1.1/006.xml | 1 | unsupported |  |  | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | ht-bh-ns11-007 | eduni/namespaces/1.1/007.xml | 1 | unsupported |  |  | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | namespaces-1.1 | ht-bh-ns11-008 | eduni/namespaces/1.1/008.xml | 1 | unsupported |  |  | XML 1.1 / NS1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.0-fifth-edition | rmt-e2e-27 | eduni/errata-2e/E27.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | rmt-e2e-34 | eduni/errata-2e/E34.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | rmt-e2e-38 | eduni/errata-2e/E38.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | rmt-e2e-50 | eduni/errata-2e/E50.xml | 1 | unsupported |  |  | XML 1.1 / XML1.0-errata2e is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.0-fifth-edition | rmt-e2e-55 | eduni/errata-2e/E55.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | rmt-e2e-57 | eduni/errata-2e/E57.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | x-rmt-008 | eduni/errata-4e/008.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-not-wf-P04a-ibm04an21.xml | eduni/errata-4e/ibm04an21.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-not-wf-P04a-ibm04an22.xml | eduni/errata-4e/ibm04an22.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-not-wf-P04a-ibm04an23.xml | eduni/errata-4e/ibm04an23.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-not-wf-P04a-ibm04an24.xml | eduni/errata-4e/ibm04an24.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-not-wf-P04-ibm04n21.xml | eduni/errata-4e/ibm04n21.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-not-wf-P04-ibm04n22.xml | eduni/errata-4e/ibm04n22.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-not-wf-P04-ibm04n23.xml | eduni/errata-4e/ibm04n23.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-not-wf-P04-ibm04n24.xml | eduni/errata-4e/ibm04n24.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-valid-P04-ibm04v01.xml | eduni/errata-4e/ibm04v01.xml | 1 | unsupported |  |  | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-valid-P05-ibm05v01.xml | eduni/errata-4e/ibm05v01.xml | 1 | unsupported |  |  | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-valid-P05-ibm05v02.xml | eduni/errata-4e/ibm05v02.xml | 1 | unsupported |  |  | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-valid-P05-ibm05v03.xml | eduni/errata-4e/ibm05v03.xml | 1 | unsupported |  |  | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | x-ibm-1-0.5-valid-P05-ibm05v05.xml | eduni/errata-4e/ibm05v05.xml | 1 | unsupported |  |  | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | invalid-bo-9 | eduni/errata-4e/incl8bomboom.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | invalid-bo-7 | eduni/errata-4e/inclbomboom_be.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | invalid-bo-8 | eduni/errata-4e/inclbomboom_le.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | hst-lhs-007 | eduni/misc/007.xml | 1 | unsupported |  |  | The fixture tests byte encoding and its XML declaration, which is not observable through DOMParser string input. |
| w3c-xml-parser | xml-1.0-fifth-edition | hst-lhs-008 | eduni/misc/008.xml | 1 | unsupported |  |  | The fixture tests byte encoding and its XML declaration, which is not observable through DOMParser string input. |
| w3c-xml-parser | xml-1.0-fifth-edition | hst-lhs-009 | eduni/misc/009.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-16be: The encoded data was not valid for encoding utf-16be |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-invalid-P58-ibm58i01.xml | ibm/invalid/P58/ibm58i01.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode raw: The "raw" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-invalid-P58-ibm58i02.xml | ibm/invalid/P58/ibm58i02.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode raw: The "raw" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-invalid-P68-ibm68i01.xml | ibm/invalid/P68/ibm68i01.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-invalid-P68-ibm68i02.xml | ibm/invalid/P68/ibm68i02.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-invalid-P68-ibm68i03.xml | ibm/invalid/P68/ibm68i03.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-invalid-P68-ibm68i04.xml | ibm/invalid/P68/ibm68i04.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-invalid-P69-ibm69i01.xml | ibm/invalid/P69/ibm69i01.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-invalid-P69-ibm69i02.xml | ibm/invalid/P69/ibm69i02.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-invalid-P69-ibm69i03.xml | ibm/invalid/P69/ibm69i03.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-invalid-P69-ibm69i04.xml | ibm/invalid/P69/ibm69i04.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P02-ibm02n30.xml | ibm/not-wf/P02/ibm02n30.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P02-ibm02n31.xml | ibm/not-wf/P02/ibm02n31.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P30-ibm30n01.xml | ibm/not-wf/P30/ibm30n01.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P31-ibm31n01.xml | ibm/not-wf/P31/ibm31n01.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P32-ibm32n09.xml | ibm/not-wf/P32/ibm32n09.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P61-ibm61n01.xml | ibm/not-wf/P61/ibm61n01.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P62-ibm62n01.xml | ibm/not-wf/P62/ibm62n01.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P62-ibm62n02.xml | ibm/not-wf/P62/ibm62n02.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P62-ibm62n03.xml | ibm/not-wf/P62/ibm62n03.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P62-ibm62n04.xml | ibm/not-wf/P62/ibm62n04.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P62-ibm62n05.xml | ibm/not-wf/P62/ibm62n05.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P62-ibm62n06.xml | ibm/not-wf/P62/ibm62n06.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P62-ibm62n07.xml | ibm/not-wf/P62/ibm62n07.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P62-ibm62n08.xml | ibm/not-wf/P62/ibm62n08.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P63-ibm63n01.xml | ibm/not-wf/P63/ibm63n01.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P63-ibm63n02.xml | ibm/not-wf/P63/ibm63n02.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P63-ibm63n03.xml | ibm/not-wf/P63/ibm63n03.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P63-ibm63n04.xml | ibm/not-wf/P63/ibm63n04.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P63-ibm63n05.xml | ibm/not-wf/P63/ibm63n05.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P63-ibm63n06.xml | ibm/not-wf/P63/ibm63n06.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P63-ibm63n07.xml | ibm/not-wf/P63/ibm63n07.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P64-ibm64n01.xml | ibm/not-wf/P64/ibm64n01.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P64-ibm64n02.xml | ibm/not-wf/P64/ibm64n02.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P64-ibm64n03.xml | ibm/not-wf/P64/ibm64n03.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P65-ibm65n01.xml | ibm/not-wf/P65/ibm65n01.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P65-ibm65n02.xml | ibm/not-wf/P65/ibm65n02.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P68-ibm68n06.xml | ibm/not-wf/P68/ibm68n06.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P69-ibm69n05.xml | ibm/not-wf/P69/ibm69n05.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P77-ibm77n01.xml | ibm/not-wf/P77/ibm77n01.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P77-ibm77n02.xml | ibm/not-wf/P77/ibm77n02.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P77-ibm77n03.xml | ibm/not-wf/P77/ibm77n03.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P77-ibm77n04.xml | ibm/not-wf/P77/ibm77n04.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P78-ibm78n01.xml | ibm/not-wf/P78/ibm78n01.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P78-ibm78n02.xml | ibm/not-wf/P78/ibm78n02.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P79-ibm79n01.xml | ibm/not-wf/P79/ibm79n01.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P79-ibm79n02.xml | ibm/not-wf/P79/ibm79n02.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P81-ibm81n01.xml | ibm/not-wf/P81/ibm81n01.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode _UTF-8: The "_UTF-8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P81-ibm81n02.xml | ibm/not-wf/P81/ibm81n02.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode -UTF-8: The "-UTF-8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P81-ibm81n03.xml | ibm/not-wf/P81/ibm81n03.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode .UTF-8: The ".UTF-8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P81-ibm81n04.xml | ibm/not-wf/P81/ibm81n04.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode 8-UTF: The "8-UTF" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P81-ibm81n05.xml | ibm/not-wf/P81/ibm81n05.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode UTF~8: The "UTF~8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P81-ibm81n06.xml | ibm/not-wf/P81/ibm81n06.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode UTF#8: The "UTF#8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P81-ibm81n07.xml | ibm/not-wf/P81/ibm81n07.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode UTF:8: The "UTF:8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P81-ibm81n08.xml | ibm/not-wf/P81/ibm81n08.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode UTF/8: The "UTF/8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P81-ibm81n09.xml | ibm/not-wf/P81/ibm81n09.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode UTF;8: The "UTF;8" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n03.xml | ibm/not-wf/P85/ibm85n03.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n04.xml | ibm/not-wf/P85/ibm85n04.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n05.xml | ibm/not-wf/P85/ibm85n05.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n06.xml | ibm/not-wf/P85/ibm85n06.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n07.xml | ibm/not-wf/P85/ibm85n07.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n08.xml | ibm/not-wf/P85/ibm85n08.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n09.xml | ibm/not-wf/P85/ibm85n09.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n10.xml | ibm/not-wf/P85/ibm85n10.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n100.xml | ibm/not-wf/P85/ibm85n100.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n101.xml | ibm/not-wf/P85/ibm85n101.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n102.xml | ibm/not-wf/P85/ibm85n102.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n103.xml | ibm/not-wf/P85/ibm85n103.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n104.xml | ibm/not-wf/P85/ibm85n104.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n105.xml | ibm/not-wf/P85/ibm85n105.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n106.xml | ibm/not-wf/P85/ibm85n106.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n107.xml | ibm/not-wf/P85/ibm85n107.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n108.xml | ibm/not-wf/P85/ibm85n108.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n109.xml | ibm/not-wf/P85/ibm85n109.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n11.xml | ibm/not-wf/P85/ibm85n11.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n110.xml | ibm/not-wf/P85/ibm85n110.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n111.xml | ibm/not-wf/P85/ibm85n111.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n112.xml | ibm/not-wf/P85/ibm85n112.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n113.xml | ibm/not-wf/P85/ibm85n113.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n114.xml | ibm/not-wf/P85/ibm85n114.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n115.xml | ibm/not-wf/P85/ibm85n115.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n116.xml | ibm/not-wf/P85/ibm85n116.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n117.xml | ibm/not-wf/P85/ibm85n117.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n118.xml | ibm/not-wf/P85/ibm85n118.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n119.xml | ibm/not-wf/P85/ibm85n119.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n12.xml | ibm/not-wf/P85/ibm85n12.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n120.xml | ibm/not-wf/P85/ibm85n120.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n121.xml | ibm/not-wf/P85/ibm85n121.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n122.xml | ibm/not-wf/P85/ibm85n122.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n123.xml | ibm/not-wf/P85/ibm85n123.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n124.xml | ibm/not-wf/P85/ibm85n124.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n125.xml | ibm/not-wf/P85/ibm85n125.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n126.xml | ibm/not-wf/P85/ibm85n126.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n127.xml | ibm/not-wf/P85/ibm85n127.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n128.xml | ibm/not-wf/P85/ibm85n128.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n129.xml | ibm/not-wf/P85/ibm85n129.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n13.xml | ibm/not-wf/P85/ibm85n13.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n130.xml | ibm/not-wf/P85/ibm85n130.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n131.xml | ibm/not-wf/P85/ibm85n131.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n132.xml | ibm/not-wf/P85/ibm85n132.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n133.xml | ibm/not-wf/P85/ibm85n133.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n134.xml | ibm/not-wf/P85/ibm85n134.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n135.xml | ibm/not-wf/P85/ibm85n135.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n136.xml | ibm/not-wf/P85/ibm85n136.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n137.xml | ibm/not-wf/P85/ibm85n137.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n138.xml | ibm/not-wf/P85/ibm85n138.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n139.xml | ibm/not-wf/P85/ibm85n139.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n14.xml | ibm/not-wf/P85/ibm85n14.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n140.xml | ibm/not-wf/P85/ibm85n140.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n141.xml | ibm/not-wf/P85/ibm85n141.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n142.xml | ibm/not-wf/P85/ibm85n142.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n143.xml | ibm/not-wf/P85/ibm85n143.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n144.xml | ibm/not-wf/P85/ibm85n144.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n145.xml | ibm/not-wf/P85/ibm85n145.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n146.xml | ibm/not-wf/P85/ibm85n146.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n147.xml | ibm/not-wf/P85/ibm85n147.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n148.xml | ibm/not-wf/P85/ibm85n148.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n149.xml | ibm/not-wf/P85/ibm85n149.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n15.xml | ibm/not-wf/P85/ibm85n15.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n150.xml | ibm/not-wf/P85/ibm85n150.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n151.xml | ibm/not-wf/P85/ibm85n151.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n152.xml | ibm/not-wf/P85/ibm85n152.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n153.xml | ibm/not-wf/P85/ibm85n153.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n154.xml | ibm/not-wf/P85/ibm85n154.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n155.xml | ibm/not-wf/P85/ibm85n155.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n156.xml | ibm/not-wf/P85/ibm85n156.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n157.xml | ibm/not-wf/P85/ibm85n157.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n158.xml | ibm/not-wf/P85/ibm85n158.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n159.xml | ibm/not-wf/P85/ibm85n159.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n16.xml | ibm/not-wf/P85/ibm85n16.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n160.xml | ibm/not-wf/P85/ibm85n160.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n161.xml | ibm/not-wf/P85/ibm85n161.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n162.xml | ibm/not-wf/P85/ibm85n162.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n163.xml | ibm/not-wf/P85/ibm85n163.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n164.xml | ibm/not-wf/P85/ibm85n164.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n165.xml | ibm/not-wf/P85/ibm85n165.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n166.xml | ibm/not-wf/P85/ibm85n166.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n167.xml | ibm/not-wf/P85/ibm85n167.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n168.xml | ibm/not-wf/P85/ibm85n168.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n169.xml | ibm/not-wf/P85/ibm85n169.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n17.xml | ibm/not-wf/P85/ibm85n17.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n170.xml | ibm/not-wf/P85/ibm85n170.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n171.xml | ibm/not-wf/P85/ibm85n171.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n172.xml | ibm/not-wf/P85/ibm85n172.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n173.xml | ibm/not-wf/P85/ibm85n173.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n174.xml | ibm/not-wf/P85/ibm85n174.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n175.xml | ibm/not-wf/P85/ibm85n175.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n176.xml | ibm/not-wf/P85/ibm85n176.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n177.xml | ibm/not-wf/P85/ibm85n177.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n178.xml | ibm/not-wf/P85/ibm85n178.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n179.xml | ibm/not-wf/P85/ibm85n179.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n18.xml | ibm/not-wf/P85/ibm85n18.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n180.xml | ibm/not-wf/P85/ibm85n180.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n181.xml | ibm/not-wf/P85/ibm85n181.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n182.xml | ibm/not-wf/P85/ibm85n182.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n183.xml | ibm/not-wf/P85/ibm85n183.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n184.xml | ibm/not-wf/P85/ibm85n184.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n185.xml | ibm/not-wf/P85/ibm85n185.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n186.xml | ibm/not-wf/P85/ibm85n186.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n187.xml | ibm/not-wf/P85/ibm85n187.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n188.xml | ibm/not-wf/P85/ibm85n188.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n189.xml | ibm/not-wf/P85/ibm85n189.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n19.xml | ibm/not-wf/P85/ibm85n19.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n190.xml | ibm/not-wf/P85/ibm85n190.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n191.xml | ibm/not-wf/P85/ibm85n191.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n192.xml | ibm/not-wf/P85/ibm85n192.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n193.xml | ibm/not-wf/P85/ibm85n193.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n194.xml | ibm/not-wf/P85/ibm85n194.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n195.xml | ibm/not-wf/P85/ibm85n195.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n196.xml | ibm/not-wf/P85/ibm85n196.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n197.xml | ibm/not-wf/P85/ibm85n197.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n198.xml | ibm/not-wf/P85/ibm85n198.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n20.xml | ibm/not-wf/P85/ibm85n20.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n21.xml | ibm/not-wf/P85/ibm85n21.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n22.xml | ibm/not-wf/P85/ibm85n22.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n23.xml | ibm/not-wf/P85/ibm85n23.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n24.xml | ibm/not-wf/P85/ibm85n24.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n25.xml | ibm/not-wf/P85/ibm85n25.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n26.xml | ibm/not-wf/P85/ibm85n26.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n27.xml | ibm/not-wf/P85/ibm85n27.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n28.xml | ibm/not-wf/P85/ibm85n28.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n29.xml | ibm/not-wf/P85/ibm85n29.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n30.xml | ibm/not-wf/P85/ibm85n30.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n31.xml | ibm/not-wf/P85/ibm85n31.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n32.xml | ibm/not-wf/P85/ibm85n32.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n33.xml | ibm/not-wf/P85/ibm85n33.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n34.xml | ibm/not-wf/P85/ibm85n34.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n35.xml | ibm/not-wf/P85/ibm85n35.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n36.xml | ibm/not-wf/P85/ibm85n36.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n37.xml | ibm/not-wf/P85/ibm85n37.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n38.xml | ibm/not-wf/P85/ibm85n38.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n39.xml | ibm/not-wf/P85/ibm85n39.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n40.xml | ibm/not-wf/P85/ibm85n40.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n41.xml | ibm/not-wf/P85/ibm85n41.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n42.xml | ibm/not-wf/P85/ibm85n42.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n43.xml | ibm/not-wf/P85/ibm85n43.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n44.xml | ibm/not-wf/P85/ibm85n44.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n45.xml | ibm/not-wf/P85/ibm85n45.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n46.xml | ibm/not-wf/P85/ibm85n46.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n47.xml | ibm/not-wf/P85/ibm85n47.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n48.xml | ibm/not-wf/P85/ibm85n48.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n49.xml | ibm/not-wf/P85/ibm85n49.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n50.xml | ibm/not-wf/P85/ibm85n50.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n51.xml | ibm/not-wf/P85/ibm85n51.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n52.xml | ibm/not-wf/P85/ibm85n52.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n53.xml | ibm/not-wf/P85/ibm85n53.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n54.xml | ibm/not-wf/P85/ibm85n54.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n55.xml | ibm/not-wf/P85/ibm85n55.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n56.xml | ibm/not-wf/P85/ibm85n56.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n57.xml | ibm/not-wf/P85/ibm85n57.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n58.xml | ibm/not-wf/P85/ibm85n58.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n59.xml | ibm/not-wf/P85/ibm85n59.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n60.xml | ibm/not-wf/P85/ibm85n60.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n61.xml | ibm/not-wf/P85/ibm85n61.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n62.xml | ibm/not-wf/P85/ibm85n62.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n63.xml | ibm/not-wf/P85/ibm85n63.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n64.xml | ibm/not-wf/P85/ibm85n64.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n65.xml | ibm/not-wf/P85/ibm85n65.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n66.xml | ibm/not-wf/P85/ibm85n66.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n67.xml | ibm/not-wf/P85/ibm85n67.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n68.xml | ibm/not-wf/P85/ibm85n68.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n69.xml | ibm/not-wf/P85/ibm85n69.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n70.xml | ibm/not-wf/P85/ibm85n70.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n71.xml | ibm/not-wf/P85/ibm85n71.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n72.xml | ibm/not-wf/P85/ibm85n72.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n73.xml | ibm/not-wf/P85/ibm85n73.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n74.xml | ibm/not-wf/P85/ibm85n74.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n75.xml | ibm/not-wf/P85/ibm85n75.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n76.xml | ibm/not-wf/P85/ibm85n76.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n77.xml | ibm/not-wf/P85/ibm85n77.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n78.xml | ibm/not-wf/P85/ibm85n78.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n79.xml | ibm/not-wf/P85/ibm85n79.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n80.xml | ibm/not-wf/P85/ibm85n80.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n81.xml | ibm/not-wf/P85/ibm85n81.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n82.xml | ibm/not-wf/P85/ibm85n82.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n83.xml | ibm/not-wf/P85/ibm85n83.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n84.xml | ibm/not-wf/P85/ibm85n84.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n85.xml | ibm/not-wf/P85/ibm85n85.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n86.xml | ibm/not-wf/P85/ibm85n86.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n87.xml | ibm/not-wf/P85/ibm85n87.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n88.xml | ibm/not-wf/P85/ibm85n88.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n89.xml | ibm/not-wf/P85/ibm85n89.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n90.xml | ibm/not-wf/P85/ibm85n90.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n91.xml | ibm/not-wf/P85/ibm85n91.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n92.xml | ibm/not-wf/P85/ibm85n92.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n93.xml | ibm/not-wf/P85/ibm85n93.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n94.xml | ibm/not-wf/P85/ibm85n94.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n95.xml | ibm/not-wf/P85/ibm85n95.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n96.xml | ibm/not-wf/P85/ibm85n96.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n97.xml | ibm/not-wf/P85/ibm85n97.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n98.xml | ibm/not-wf/P85/ibm85n98.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P85-ibm85n99.xml | ibm/not-wf/P85/ibm85n99.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P86-ibm86n01.xml | ibm/not-wf/P86/ibm86n01.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P86-ibm86n02.xml | ibm/not-wf/P86/ibm86n02.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P86-ibm86n03.xml | ibm/not-wf/P86/ibm86n03.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P86-ibm86n04.xml | ibm/not-wf/P86/ibm86n04.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n01.xml | ibm/not-wf/P87/ibm87n01.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n02.xml | ibm/not-wf/P87/ibm87n02.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n03.xml | ibm/not-wf/P87/ibm87n03.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n04.xml | ibm/not-wf/P87/ibm87n04.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n05.xml | ibm/not-wf/P87/ibm87n05.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n06.xml | ibm/not-wf/P87/ibm87n06.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n07.xml | ibm/not-wf/P87/ibm87n07.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n08.xml | ibm/not-wf/P87/ibm87n08.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n09.xml | ibm/not-wf/P87/ibm87n09.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n10.xml | ibm/not-wf/P87/ibm87n10.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n11.xml | ibm/not-wf/P87/ibm87n11.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n12.xml | ibm/not-wf/P87/ibm87n12.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n13.xml | ibm/not-wf/P87/ibm87n13.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n14.xml | ibm/not-wf/P87/ibm87n14.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n15.xml | ibm/not-wf/P87/ibm87n15.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n16.xml | ibm/not-wf/P87/ibm87n16.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n17.xml | ibm/not-wf/P87/ibm87n17.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n18.xml | ibm/not-wf/P87/ibm87n18.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n19.xml | ibm/not-wf/P87/ibm87n19.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n20.xml | ibm/not-wf/P87/ibm87n20.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n21.xml | ibm/not-wf/P87/ibm87n21.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n22.xml | ibm/not-wf/P87/ibm87n22.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n23.xml | ibm/not-wf/P87/ibm87n23.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n24.xml | ibm/not-wf/P87/ibm87n24.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n25.xml | ibm/not-wf/P87/ibm87n25.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n26.xml | ibm/not-wf/P87/ibm87n26.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n27.xml | ibm/not-wf/P87/ibm87n27.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n28.xml | ibm/not-wf/P87/ibm87n28.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n29.xml | ibm/not-wf/P87/ibm87n29.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n30.xml | ibm/not-wf/P87/ibm87n30.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n31.xml | ibm/not-wf/P87/ibm87n31.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n32.xml | ibm/not-wf/P87/ibm87n32.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n33.xml | ibm/not-wf/P87/ibm87n33.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n34.xml | ibm/not-wf/P87/ibm87n34.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n35.xml | ibm/not-wf/P87/ibm87n35.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n36.xml | ibm/not-wf/P87/ibm87n36.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n37.xml | ibm/not-wf/P87/ibm87n37.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n38.xml | ibm/not-wf/P87/ibm87n38.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n39.xml | ibm/not-wf/P87/ibm87n39.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n40.xml | ibm/not-wf/P87/ibm87n40.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n41.xml | ibm/not-wf/P87/ibm87n41.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n42.xml | ibm/not-wf/P87/ibm87n42.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n43.xml | ibm/not-wf/P87/ibm87n43.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n44.xml | ibm/not-wf/P87/ibm87n44.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n45.xml | ibm/not-wf/P87/ibm87n45.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n46.xml | ibm/not-wf/P87/ibm87n46.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n47.xml | ibm/not-wf/P87/ibm87n47.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n48.xml | ibm/not-wf/P87/ibm87n48.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n49.xml | ibm/not-wf/P87/ibm87n49.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n50.xml | ibm/not-wf/P87/ibm87n50.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n51.xml | ibm/not-wf/P87/ibm87n51.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n52.xml | ibm/not-wf/P87/ibm87n52.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n53.xml | ibm/not-wf/P87/ibm87n53.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n54.xml | ibm/not-wf/P87/ibm87n54.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n55.xml | ibm/not-wf/P87/ibm87n55.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n56.xml | ibm/not-wf/P87/ibm87n56.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n57.xml | ibm/not-wf/P87/ibm87n57.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n58.xml | ibm/not-wf/P87/ibm87n58.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n59.xml | ibm/not-wf/P87/ibm87n59.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n60.xml | ibm/not-wf/P87/ibm87n60.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n61.xml | ibm/not-wf/P87/ibm87n61.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n62.xml | ibm/not-wf/P87/ibm87n62.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n63.xml | ibm/not-wf/P87/ibm87n63.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n64.xml | ibm/not-wf/P87/ibm87n64.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n66.xml | ibm/not-wf/P87/ibm87n66.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n67.xml | ibm/not-wf/P87/ibm87n67.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n68.xml | ibm/not-wf/P87/ibm87n68.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n69.xml | ibm/not-wf/P87/ibm87n69.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n70.xml | ibm/not-wf/P87/ibm87n70.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n71.xml | ibm/not-wf/P87/ibm87n71.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n72.xml | ibm/not-wf/P87/ibm87n72.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n73.xml | ibm/not-wf/P87/ibm87n73.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n74.xml | ibm/not-wf/P87/ibm87n74.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n75.xml | ibm/not-wf/P87/ibm87n75.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n76.xml | ibm/not-wf/P87/ibm87n76.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n77.xml | ibm/not-wf/P87/ibm87n77.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n78.xml | ibm/not-wf/P87/ibm87n78.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n79.xml | ibm/not-wf/P87/ibm87n79.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n80.xml | ibm/not-wf/P87/ibm87n80.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n81.xml | ibm/not-wf/P87/ibm87n81.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n82.xml | ibm/not-wf/P87/ibm87n82.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n83.xml | ibm/not-wf/P87/ibm87n83.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n84.xml | ibm/not-wf/P87/ibm87n84.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P87-ibm87n85.xml | ibm/not-wf/P87/ibm87n85.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n03.xml | ibm/not-wf/P88/ibm88n03.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n04.xml | ibm/not-wf/P88/ibm88n04.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n05.xml | ibm/not-wf/P88/ibm88n05.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n06.xml | ibm/not-wf/P88/ibm88n06.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n08.xml | ibm/not-wf/P88/ibm88n08.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n09.xml | ibm/not-wf/P88/ibm88n09.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n10.xml | ibm/not-wf/P88/ibm88n10.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n11.xml | ibm/not-wf/P88/ibm88n11.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n12.xml | ibm/not-wf/P88/ibm88n12.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n13.xml | ibm/not-wf/P88/ibm88n13.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n14.xml | ibm/not-wf/P88/ibm88n14.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n15.xml | ibm/not-wf/P88/ibm88n15.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P88-ibm88n16.xml | ibm/not-wf/P88/ibm88n16.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P89-ibm89n03.xml | ibm/not-wf/P89/ibm89n03.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P89-ibm89n04.xml | ibm/not-wf/P89/ibm89n04.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P89-ibm89n05.xml | ibm/not-wf/P89/ibm89n05.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P89-ibm89n06.xml | ibm/not-wf/P89/ibm89n06.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P89-ibm89n07.xml | ibm/not-wf/P89/ibm89n07.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P89-ibm89n08.xml | ibm/not-wf/P89/ibm89n08.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P89-ibm89n09.xml | ibm/not-wf/P89/ibm89n09.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P89-ibm89n10.xml | ibm/not-wf/P89/ibm89n10.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P89-ibm89n11.xml | ibm/not-wf/P89/ibm89n11.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-P89-ibm89n12.xml | ibm/not-wf/P89/ibm89n12.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-not-wf-p28a-ibm28an01.xml | ibm/not-wf/p28a/ibm28an01.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | ibm-valid-P58-ibm58v02.xml | ibm/valid/P58/ibm58v02.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode base64: The "base64" encoding is not supported |
| w3c-xml-parser | xml-1.0-fifth-edition | pr-xml-euc-jp | japanese/pr-xml-euc-jp.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | pr-xml-iso-2022-jp | japanese/pr-xml-iso-2022-jp.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | pr-xml-little | japanese/pr-xml-little-endian.xml | 1 | unsupported |  |  | The fixture tests byte encoding and its XML declaration, which is not observable through DOMParser string input. |
| w3c-xml-parser | xml-1.0-fifth-edition | pr-xml-shift_jis | japanese/pr-xml-shift_jis.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | pr-xml-utf-16 | japanese/pr-xml-utf-16.xml | 1 | unsupported |  |  | The fixture tests byte encoding and its XML declaration, which is not observable through DOMParser string input. |
| w3c-xml-parser | xml-1.0-fifth-edition | weekly-euc-jp | japanese/weekly-euc-jp.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | weekly-iso-2022-jp | japanese/weekly-iso-2022-jp.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | weekly-shift_jis | japanese/weekly-shift_jis.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p04pass1 | oasis/p04pass1.xml | 1 | unsupported |  |  | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p05pass1 | oasis/p05pass1.xml | 1 | unsupported |  |  | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p09fail1 | oasis/p09fail1.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p09fail2 | oasis/p09fail2.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p11pass1 | oasis/p11pass1.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p30fail1 | oasis/p30fail1.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p31fail1 | oasis/p31fail1.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p61fail1 | oasis/p61fail1.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p62fail1 | oasis/p62fail1.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p62fail2 | oasis/p62fail2.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p63fail1 | oasis/p63fail1.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p63fail2 | oasis/p63fail2.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p64fail1 | oasis/p64fail1.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | o-p64fail2 | oasis/p64fail2.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-ext-sa-001 | xmltest/not-wf/ext-sa/001.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-ext-sa-002 | xmltest/not-wf/ext-sa/002.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-ext-sa-003 | xmltest/not-wf/ext-sa/003.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-not-sa-001 | xmltest/not-wf/not-sa/001.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-not-sa-003 | xmltest/not-wf/not-sa/003.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-not-sa-004 | xmltest/not-wf/not-sa/004.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-not-sa-005 | xmltest/not-wf/not-sa/005.xml | 1 | skip |  |  | The XML recommendation does not prescribe whether this optional error is accepted. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-not-sa-006 | xmltest/not-wf/not-sa/006.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-not-sa-007 | xmltest/not-wf/not-sa/007.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-not-sa-008 | xmltest/not-wf/not-sa/008.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-not-sa-009 | xmltest/not-wf/not-sa/009.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-sa-082 | xmltest/not-wf/sa/082.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-sa-140 | xmltest/not-wf/sa/140.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-sa-141 | xmltest/not-wf/sa/141.xml | 1 | skip |  |  | The fixture does not apply to XML 1.0 Fifth Edition. |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-sa-168 | xmltest/not-wf/sa/168.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-sa-169 | xmltest/not-wf/sa/169.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-sa-170 | xmltest/not-wf/sa/170.xml | 1 | unsupported |  |  | The DOMParser string adapter cannot decode utf-8: The encoded data was not valid for encoding utf-8 |
| w3c-xml-parser | xml-1.0-fifth-edition | not-wf-sa-185 | xmltest/not-wf/sa/185.xml | 1 | skip |  |  | The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read. |
| w3c-xml-parser | xml-1.0-fifth-edition | valid-sa-012 | xmltest/valid/sa/012.xml | 1 | unsupported |  |  | The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing. |
| w3c-xml-parser | xml-1.1 | rmt-001 | eduni/xml-1.1/001.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-002 | eduni/xml-1.1/002.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-003 | eduni/xml-1.1/003.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-004 | eduni/xml-1.1/004.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-005 | eduni/xml-1.1/005.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-006 | eduni/xml-1.1/006.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-007 | eduni/xml-1.1/007.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-008 | eduni/xml-1.1/008.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-009 | eduni/xml-1.1/009.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-010 | eduni/xml-1.1/010.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-011 | eduni/xml-1.1/011.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-012 | eduni/xml-1.1/012.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-013 | eduni/xml-1.1/013.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-014 | eduni/xml-1.1/014.xml | 1 | unsupported |  |  | XML 1.0 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-015 | eduni/xml-1.1/015.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-016 | eduni/xml-1.1/016.xml | 1 | unsupported |  |  | XML 1.0 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-017 | eduni/xml-1.1/017.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-018 | eduni/xml-1.1/018.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-019 | eduni/xml-1.1/019.xml | 1 | unsupported |  |  | XML 1.0 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-020 | eduni/xml-1.1/020.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-021 | eduni/xml-1.1/021.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-022 | eduni/xml-1.1/022.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-023 | eduni/xml-1.1/023.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-024 | eduni/xml-1.1/024.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-025 | eduni/xml-1.1/025.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-026 | eduni/xml-1.1/026.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-027 | eduni/xml-1.1/027.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-028 | eduni/xml-1.1/028.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-029 | eduni/xml-1.1/029.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-030 | eduni/xml-1.1/030.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-031 | eduni/xml-1.1/031.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-032 | eduni/xml-1.1/032.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-033 | eduni/xml-1.1/033.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-034 | eduni/xml-1.1/034.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-035 | eduni/xml-1.1/035.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-036 | eduni/xml-1.1/036.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-037 | eduni/xml-1.1/037.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-038 | eduni/xml-1.1/038.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-039 | eduni/xml-1.1/039.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-040 | eduni/xml-1.1/040.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-041 | eduni/xml-1.1/041.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-042 | eduni/xml-1.1/042.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-043 | eduni/xml-1.1/043.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-044 | eduni/xml-1.1/044.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-045 | eduni/xml-1.1/045.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-046 | eduni/xml-1.1/046.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-047 | eduni/xml-1.1/047.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-048 | eduni/xml-1.1/048.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-049 | eduni/xml-1.1/049.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-050 | eduni/xml-1.1/050.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-051 | eduni/xml-1.1/051.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-052 | eduni/xml-1.1/052.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-053 | eduni/xml-1.1/053.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-054 | eduni/xml-1.1/054.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-055 | eduni/xml-1.1/055.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-056 | eduni/xml-1.1/056.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | rmt-057 | eduni/xml-1.1/057.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P46-ibm46i01.xml | ibm/xml-1.1/invalid/P46/ibm46i01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P46-ibm46i02.xml | ibm/xml-1.1/invalid/P46/ibm46i02.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n01.xml | ibm/xml-1.1/not-wf/P02/ibm02n01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n02.xml | ibm/xml-1.1/not-wf/P02/ibm02n02.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n03.xml | ibm/xml-1.1/not-wf/P02/ibm02n03.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n04.xml | ibm/xml-1.1/not-wf/P02/ibm02n04.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n05.xml | ibm/xml-1.1/not-wf/P02/ibm02n05.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n06.xml | ibm/xml-1.1/not-wf/P02/ibm02n06.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n07.xml | ibm/xml-1.1/not-wf/P02/ibm02n07.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n08.xml | ibm/xml-1.1/not-wf/P02/ibm02n08.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n09.xml | ibm/xml-1.1/not-wf/P02/ibm02n09.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n10.xml | ibm/xml-1.1/not-wf/P02/ibm02n10.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n11.xml | ibm/xml-1.1/not-wf/P02/ibm02n11.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n12.xml | ibm/xml-1.1/not-wf/P02/ibm02n12.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n13.xml | ibm/xml-1.1/not-wf/P02/ibm02n13.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n14.xml | ibm/xml-1.1/not-wf/P02/ibm02n14.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n15.xml | ibm/xml-1.1/not-wf/P02/ibm02n15.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n16.xml | ibm/xml-1.1/not-wf/P02/ibm02n16.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n17.xml | ibm/xml-1.1/not-wf/P02/ibm02n17.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n18.xml | ibm/xml-1.1/not-wf/P02/ibm02n18.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n19.xml | ibm/xml-1.1/not-wf/P02/ibm02n19.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n20.xml | ibm/xml-1.1/not-wf/P02/ibm02n20.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n21.xml | ibm/xml-1.1/not-wf/P02/ibm02n21.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n22.xml | ibm/xml-1.1/not-wf/P02/ibm02n22.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n23.xml | ibm/xml-1.1/not-wf/P02/ibm02n23.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n24.xml | ibm/xml-1.1/not-wf/P02/ibm02n24.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n25.xml | ibm/xml-1.1/not-wf/P02/ibm02n25.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n26.xml | ibm/xml-1.1/not-wf/P02/ibm02n26.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n27.xml | ibm/xml-1.1/not-wf/P02/ibm02n27.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n28.xml | ibm/xml-1.1/not-wf/P02/ibm02n28.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n29.xml | ibm/xml-1.1/not-wf/P02/ibm02n29.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n30.xml | ibm/xml-1.1/not-wf/P02/ibm02n30.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n31.xml | ibm/xml-1.1/not-wf/P02/ibm02n31.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n32.xml | ibm/xml-1.1/not-wf/P02/ibm02n32.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n33.xml | ibm/xml-1.1/not-wf/P02/ibm02n33.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n34.xml | ibm/xml-1.1/not-wf/P02/ibm02n34.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n35.xml | ibm/xml-1.1/not-wf/P02/ibm02n35.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n36.xml | ibm/xml-1.1/not-wf/P02/ibm02n36.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n37.xml | ibm/xml-1.1/not-wf/P02/ibm02n37.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n38.xml | ibm/xml-1.1/not-wf/P02/ibm02n38.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n39.xml | ibm/xml-1.1/not-wf/P02/ibm02n39.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n40.xml | ibm/xml-1.1/not-wf/P02/ibm02n40.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n41.xml | ibm/xml-1.1/not-wf/P02/ibm02n41.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n42.xml | ibm/xml-1.1/not-wf/P02/ibm02n42.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n43.xml | ibm/xml-1.1/not-wf/P02/ibm02n43.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n44.xml | ibm/xml-1.1/not-wf/P02/ibm02n44.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n45.xml | ibm/xml-1.1/not-wf/P02/ibm02n45.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n46.xml | ibm/xml-1.1/not-wf/P02/ibm02n46.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n47.xml | ibm/xml-1.1/not-wf/P02/ibm02n47.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n48.xml | ibm/xml-1.1/not-wf/P02/ibm02n48.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n49.xml | ibm/xml-1.1/not-wf/P02/ibm02n49.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n50.xml | ibm/xml-1.1/not-wf/P02/ibm02n50.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n51.xml | ibm/xml-1.1/not-wf/P02/ibm02n51.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n52.xml | ibm/xml-1.1/not-wf/P02/ibm02n52.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n53.xml | ibm/xml-1.1/not-wf/P02/ibm02n53.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n54.xml | ibm/xml-1.1/not-wf/P02/ibm02n54.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n55.xml | ibm/xml-1.1/not-wf/P02/ibm02n55.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n56.xml | ibm/xml-1.1/not-wf/P02/ibm02n56.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n57.xml | ibm/xml-1.1/not-wf/P02/ibm02n57.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n58.xml | ibm/xml-1.1/not-wf/P02/ibm02n58.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n59.xml | ibm/xml-1.1/not-wf/P02/ibm02n59.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n60.xml | ibm/xml-1.1/not-wf/P02/ibm02n60.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n61.xml | ibm/xml-1.1/not-wf/P02/ibm02n61.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n62.xml | ibm/xml-1.1/not-wf/P02/ibm02n62.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n63.xml | ibm/xml-1.1/not-wf/P02/ibm02n63.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n64.xml | ibm/xml-1.1/not-wf/P02/ibm02n64.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n65.xml | ibm/xml-1.1/not-wf/P02/ibm02n65.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n66.xml | ibm/xml-1.1/not-wf/P02/ibm02n66.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n67.xml | ibm/xml-1.1/not-wf/P02/ibm02n67.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n68.xml | ibm/xml-1.1/not-wf/P02/ibm02n68.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n69.xml | ibm/xml-1.1/not-wf/P02/ibm02n69.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n70.xml | ibm/xml-1.1/not-wf/P02/ibm02n70.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P02-ibm02n71.xml | ibm/xml-1.1/not-wf/P02/ibm02n71.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n01.xml | ibm/xml-1.1/not-wf/P04/ibm04n01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n02.xml | ibm/xml-1.1/not-wf/P04/ibm04n02.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n03.xml | ibm/xml-1.1/not-wf/P04/ibm04n03.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n04.xml | ibm/xml-1.1/not-wf/P04/ibm04n04.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n05.xml | ibm/xml-1.1/not-wf/P04/ibm04n05.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n06.xml | ibm/xml-1.1/not-wf/P04/ibm04n06.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n07.xml | ibm/xml-1.1/not-wf/P04/ibm04n07.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n08.xml | ibm/xml-1.1/not-wf/P04/ibm04n08.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n09.xml | ibm/xml-1.1/not-wf/P04/ibm04n09.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n10.xml | ibm/xml-1.1/not-wf/P04/ibm04n10.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n11.xml | ibm/xml-1.1/not-wf/P04/ibm04n11.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n12.xml | ibm/xml-1.1/not-wf/P04/ibm04n12.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n13.xml | ibm/xml-1.1/not-wf/P04/ibm04n13.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n14.xml | ibm/xml-1.1/not-wf/P04/ibm04n14.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n15.xml | ibm/xml-1.1/not-wf/P04/ibm04n15.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n16.xml | ibm/xml-1.1/not-wf/P04/ibm04n16.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n17.xml | ibm/xml-1.1/not-wf/P04/ibm04n17.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n18.xml | ibm/xml-1.1/not-wf/P04/ibm04n18.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n19.xml | ibm/xml-1.1/not-wf/P04/ibm04n19.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n20.xml | ibm/xml-1.1/not-wf/P04/ibm04n20.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n21.xml | ibm/xml-1.1/not-wf/P04/ibm04n21.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n22.xml | ibm/xml-1.1/not-wf/P04/ibm04n22.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n23.xml | ibm/xml-1.1/not-wf/P04/ibm04n23.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n24.xml | ibm/xml-1.1/not-wf/P04/ibm04n24.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n25.xml | ibm/xml-1.1/not-wf/P04/ibm04n25.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n26.xml | ibm/xml-1.1/not-wf/P04/ibm04n26.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n27.xml | ibm/xml-1.1/not-wf/P04/ibm04n27.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04-ibm04n28.xml | ibm/xml-1.1/not-wf/P04/ibm04n28.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an01.xml | ibm/xml-1.1/not-wf/P04a/ibm04an01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an02.xml | ibm/xml-1.1/not-wf/P04a/ibm04an02.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an03.xml | ibm/xml-1.1/not-wf/P04a/ibm04an03.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an04.xml | ibm/xml-1.1/not-wf/P04a/ibm04an04.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an05.xml | ibm/xml-1.1/not-wf/P04a/ibm04an05.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an06.xml | ibm/xml-1.1/not-wf/P04a/ibm04an06.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an07.xml | ibm/xml-1.1/not-wf/P04a/ibm04an07.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an08.xml | ibm/xml-1.1/not-wf/P04a/ibm04an08.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an09.xml | ibm/xml-1.1/not-wf/P04a/ibm04an09.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an10.xml | ibm/xml-1.1/not-wf/P04a/ibm04an10.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an11.xml | ibm/xml-1.1/not-wf/P04a/ibm04an11.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an12.xml | ibm/xml-1.1/not-wf/P04a/ibm04an12.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an13.xml | ibm/xml-1.1/not-wf/P04a/ibm04an13.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an14.xml | ibm/xml-1.1/not-wf/P04a/ibm04an14.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an15.xml | ibm/xml-1.1/not-wf/P04a/ibm04an15.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an16.xml | ibm/xml-1.1/not-wf/P04a/ibm04an16.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an17.xml | ibm/xml-1.1/not-wf/P04a/ibm04an17.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an18.xml | ibm/xml-1.1/not-wf/P04a/ibm04an18.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an19.xml | ibm/xml-1.1/not-wf/P04a/ibm04an19.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an20.xml | ibm/xml-1.1/not-wf/P04a/ibm04an20.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an21.xml | ibm/xml-1.1/not-wf/P04a/ibm04an21.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an22.xml | ibm/xml-1.1/not-wf/P04a/ibm04an22.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an23.xml | ibm/xml-1.1/not-wf/P04a/ibm04an23.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an24.xml | ibm/xml-1.1/not-wf/P04a/ibm04an24.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an25.xml | ibm/xml-1.1/not-wf/P04a/ibm04an25.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an26.xml | ibm/xml-1.1/not-wf/P04a/ibm04an26.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an27.xml | ibm/xml-1.1/not-wf/P04a/ibm04an27.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P04a-ibm04an28.xml | ibm/xml-1.1/not-wf/P04a/ibm04an28.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P05-ibm05n01.xml | ibm/xml-1.1/not-wf/P05/ibm05n01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P05-ibm05n02.xml | ibm/xml-1.1/not-wf/P05/ibm05n02.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P05-ibm05n03.xml | ibm/xml-1.1/not-wf/P05/ibm05n03.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P05-ibm05n04.xml | ibm/xml-1.1/not-wf/P05/ibm05n04.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P05-ibm05n05.xml | ibm/xml-1.1/not-wf/P05/ibm05n05.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P05-ibm05n06.xml | ibm/xml-1.1/not-wf/P05/ibm05n06.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n01.xml | ibm/xml-1.1/not-wf/P77/ibm77n01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n02.xml | ibm/xml-1.1/not-wf/P77/ibm77n02.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n03.xml | ibm/xml-1.1/not-wf/P77/ibm77n03.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n04.xml | ibm/xml-1.1/not-wf/P77/ibm77n04.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n05.xml | ibm/xml-1.1/not-wf/P77/ibm77n05.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n06.xml | ibm/xml-1.1/not-wf/P77/ibm77n06.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n07.xml | ibm/xml-1.1/not-wf/P77/ibm77n07.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n08.xml | ibm/xml-1.1/not-wf/P77/ibm77n08.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n09.xml | ibm/xml-1.1/not-wf/P77/ibm77n09.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n10.xml | ibm/xml-1.1/not-wf/P77/ibm77n10.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n11.xml | ibm/xml-1.1/not-wf/P77/ibm77n11.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n12.xml | ibm/xml-1.1/not-wf/P77/ibm77n12.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n13.xml | ibm/xml-1.1/not-wf/P77/ibm77n13.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n14.xml | ibm/xml-1.1/not-wf/P77/ibm77n14.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n15.xml | ibm/xml-1.1/not-wf/P77/ibm77n15.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n16.xml | ibm/xml-1.1/not-wf/P77/ibm77n16.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n17.xml | ibm/xml-1.1/not-wf/P77/ibm77n17.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n18.xml | ibm/xml-1.1/not-wf/P77/ibm77n18.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n19.xml | ibm/xml-1.1/not-wf/P77/ibm77n19.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n20.xml | ibm/xml-1.1/not-wf/P77/ibm77n20.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-not-wf-P77-ibm77n21.xml | ibm/xml-1.1/not-wf/P77/ibm77n21.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P02-ibm02v01.xml | ibm/xml-1.1/valid/P02/ibm02v01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P02-ibm02v02.xml | ibm/xml-1.1/valid/P02/ibm02v02.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P02-ibm02v03.xml | ibm/xml-1.1/valid/P02/ibm02v03.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P02-ibm02v04.xml | ibm/xml-1.1/valid/P02/ibm02v04.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P02-ibm02v05.xml | ibm/xml-1.1/valid/P02/ibm02v05.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P02-ibm02v06.xml | ibm/xml-1.1/valid/P02/ibm02v06.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P03-ibm03v01.xml | ibm/xml-1.1/valid/P03/ibm03v01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P03-ibm03v02.xml | ibm/xml-1.1/valid/P03/ibm03v02.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P03-ibm03v03.xml | ibm/xml-1.1/valid/P03/ibm03v03.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P03-ibm03v04.xml | ibm/xml-1.1/valid/P03/ibm03v04.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P03-ibm03v05.xml | ibm/xml-1.1/valid/P03/ibm03v05.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P03-ibm03v06.xml | ibm/xml-1.1/valid/P03/ibm03v06.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P03-ibm03v07.xml | ibm/xml-1.1/valid/P03/ibm03v07.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P03-ibm03v08.xml | ibm/xml-1.1/valid/P03/ibm03v08.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P03-ibm03v09.xml | ibm/xml-1.1/valid/P03/ibm03v09.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P04-ibm04v01.xml | ibm/xml-1.1/valid/P04/ibm04v01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P04-ibm04av01.xml | ibm/xml-1.1/valid/P04a/ibm04av01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P05-ibm05v01.xml | ibm/xml-1.1/valid/P05/ibm05v01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P05-ibm05v02.xml | ibm/xml-1.1/valid/P05/ibm05v02.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P05-ibm05v03.xml | ibm/xml-1.1/valid/P05/ibm05v03.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P05-ibm05v04.xml | ibm/xml-1.1/valid/P05/ibm05v04.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P05-ibm05v05.xml | ibm/xml-1.1/valid/P05/ibm05v05.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P047-ibm07v01.xml | ibm/xml-1.1/valid/P07/ibm07v01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v01.xml | ibm/xml-1.1/valid/P77/ibm77v01.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v02.xml | ibm/xml-1.1/valid/P77/ibm77v02.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v03.xml | ibm/xml-1.1/valid/P77/ibm77v03.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v04.xml | ibm/xml-1.1/valid/P77/ibm77v04.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v05.xml | ibm/xml-1.1/valid/P77/ibm77v05.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v06.xml | ibm/xml-1.1/valid/P77/ibm77v06.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v07.xml | ibm/xml-1.1/valid/P77/ibm77v07.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v08.xml | ibm/xml-1.1/valid/P77/ibm77v08.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v09.xml | ibm/xml-1.1/valid/P77/ibm77v09.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v10.xml | ibm/xml-1.1/valid/P77/ibm77v10.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v11.xml | ibm/xml-1.1/valid/P77/ibm77v11.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v12.xml | ibm/xml-1.1/valid/P77/ibm77v12.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v13.xml | ibm/xml-1.1/valid/P77/ibm77v13.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v14.xml | ibm/xml-1.1/valid/P77/ibm77v14.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v15.xml | ibm/xml-1.1/valid/P77/ibm77v15.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v16.xml | ibm/xml-1.1/valid/P77/ibm77v16.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v17.xml | ibm/xml-1.1/valid/P77/ibm77v17.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v18.xml | ibm/xml-1.1/valid/P77/ibm77v18.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v19.xml | ibm/xml-1.1/valid/P77/ibm77v19.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v20.xml | ibm/xml-1.1/valid/P77/ibm77v20.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v21.xml | ibm/xml-1.1/valid/P77/ibm77v21.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v22.xml | ibm/xml-1.1/valid/P77/ibm77v22.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v23.xml | ibm/xml-1.1/valid/P77/ibm77v23.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v24.xml | ibm/xml-1.1/valid/P77/ibm77v24.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v25.xml | ibm/xml-1.1/valid/P77/ibm77v25.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v26.xml | ibm/xml-1.1/valid/P77/ibm77v26.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v27.xml | ibm/xml-1.1/valid/P77/ibm77v27.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v28.xml | ibm/xml-1.1/valid/P77/ibm77v28.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v29.xml | ibm/xml-1.1/valid/P77/ibm77v29.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
| w3c-xml-parser | xml-1.1 | ibm-1-1-valid-P77-ibm77v30.xml | ibm/xml-1.1/valid/P77/ibm77v30.xml | 1 | unsupported |  |  | XML 1.1 / XML1.1 is outside the XML 1.0 and Namespaces in XML 1.0 profile. |
