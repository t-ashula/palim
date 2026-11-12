# palim capabilities

This document describes the current capabilities of the full `palim` package.
It is a qualitative guide to what applications can expect to use; it is not a
standards-conformance score.

The status labels have the following meanings:

- **OK** — a usable implementation is available for the scope described here.
- **Partial** — a narrower subset is available, with important related behavior
  still missing.
- **NG** — the capability is not currently provided.

`OK` does not mean that every requirement or edge case in the relevant web
standard is implemented. See the [WPT progress report](../reports/wpt/report.md)
for quantitative interoperability results.

Capability status, implementation status, and conformance verification are
different observations:

- This document records whether an application can use a capability in the
  scope described below.
- The presence of an interface or method does not show that every standard
  algorithm, state transition, Web IDL rule, or realm binding has been
  verified.
- The WPT progress report records page-realm integration results and can
  include failures caused by Window lifecycle, CSS, layout, networking,
  JavaScript engine, or runner limitations outside a DOM algorithm.
- DOM conformance is audited per standard behavior and per implementation,
  package-interface, realm-binding, and integration layer as described in the
  [DOM conformance workflow](./dom-conformance-workflow.md).

Until a behavior has conformance evidence, its capability status must not be
read as `verified`. Conversely, a WPT blocked by an unrelated browser
capability does not by itself change the usable scope recorded here.

## Parsing and serialization

| Capability                    | Status  | Current scope and limitations                                                          |
| ----------------------------- | :-----: | -------------------------------------------------------------------------------------- |
| HTML document parsing         |   OK    | `DOMParser`, `open()`, and HTML byte input construct HTML documents                    |
| XML document parsing          |   OK    | XML, XHTML, and SVG XML MIME types are accepted; `open()` also recognizes `+xml` types |
| Fragment parsing              |   OK    | `innerHTML`, `outerHTML`, `insertAdjacentHTML`, and contextual fragment parsing        |
| HTML and XML serialization    |   OK    | HTML markup serialization and `XMLSerializer`                                          |
| Streaming HTML input          | Partial | Incremental parsing exists, but does not provide a complete browser loading lifecycle  |

## DOM APIs

| Capability                         | Status  | Current scope and limitations                                                       |
| ---------------------------------- | :-----: | ----------------------------------------------------------------------------------- |
| Tree inspection and mutation       |   OK    | Nodes, attributes, collections, cloning, adoption, normalization, and relationships |
| CSS selector APIs                  |   OK    | `querySelector`, `querySelectorAll`, `matches`, and `closest`                       |
| Traversal                          |   OK    | `NodeIterator`, `TreeWalker`, and `NodeFilter`                                      |
| Ranges                             |   OK    | Live `Range` objects created by `Document.createRange()`                            |
| Events                             |   OK    | Event listeners, dispatch, propagation, cancellation, and abort signals             |
| Mutation observers                 |   OK    | DOM mutation records and asynchronous observer delivery                             |
| HTML element interfaces            | Partial | Element-specific interfaces and reflected attributes exist; browser behavior varies |
| Forms                              | Partial | Form controls, ownership, basic submission events, and `FormData`; no navigation    |
| Shadow DOM and slots               | Partial | Shadow roots, slot assignment, and related tree operations                          |
| Custom elements                    | Partial | Registry, registered-element construction, and lifecycle reactions; upgrades are incomplete |

## Window and loading

| Capability                       | Status  | Current scope and limitations                                                            |
| -------------------------------- | :-----: | ---------------------------------------------------------------------------------------- |
| Window environment               |   OK    | `open()` creates a `Window`, `WindowProxy`, and active `Document`                        |
| Initial document loading         |   OK    | A URL can be fetched, decoded, and parsed as HTML or XML                                  |
| Subresource loading              | Partial | Selected element resources are discovered and loaded without a complete fetch policy     |
| `Location`                       | Partial | A read-only view of the active document URL is exposed; navigation is unavailable        |
| `iframe`                         | Partial | `src` and `srcdoc` create child documents, run classic scripts when enabled, and fire `load`; sandbox, lazy loading, and cross-origin enforcement are not implemented |
| Nested browsing contexts         | Partial | Child `Window` objects expose `parent`, `top`, and `frameElement`; navigation and session history remain incomplete |
| Navigation and session history   |   NG    | No complete navigation algorithm, history stack, or document replacement model           |
| Page networking APIs             |   NG    | `fetch`, `XMLHttpRequest`, WebSocket, and browser networking policy are not exposed       |

## JavaScript execution

Scripting is disabled by default and must be enabled with
`{ scripting: "enabled" }`.

| Capability                       | Status  | Current scope and limitations                                                        |
| -------------------------------- | :-----: | ------------------------------------------------------------------------------------ |
| Inline classic scripts           |   OK    | Parser-inserted scripts execute in document order in the page realm                  |
| External classic scripts         | Partial | Parser blocking and execution order are supported through the resource-loader boundary |
| Dynamically inserted scripts     | Partial | Classic scripts are supported for the implemented insertion paths                   |
| JavaScript modules               |   NG    | Module scripts, module graphs, and import maps are not executed                      |
| DOM bindings in the page realm   | Partial | Implemented DOM and HTML interfaces are exposed; the full browser global surface is not |
| Timers                           | Partial | `setTimeout` and `clearTimeout` are available; the complete timer API is not          |
| Script error reporting           | Partial | Script failures are recorded and reported without a complete browser error lifecycle |

## CSS and rendering

| Capability                      | Status  | Current scope and limitations                                                       |
| ------------------------------- | :-----: | ----------------------------------------------------------------------------------- |
| Inline style declarations       | Partial | `style`, `cssText`, and a small set of declaration operations and properties        |
| Stylesheet parsing              |   NG    | `<style>` and linked stylesheets do not produce a CSS rule model                    |
| Cascade and computed styles     |   NG    | No cascade, inheritance calculation, or `getComputedStyle()`                        |
| Layout                          |   NG    | No box generation, geometry, scrolling layout, or layout-dependent measurements     |
| Rendering and painting          |   NG    | No visual rendering pipeline, graphics output, or screenshots                       |

## Other browser capabilities

| Capability                    | Status | Current scope and limitations                                   |
| ----------------------------- | :----: | --------------------------------------------------------------- |
| Storage                       |   NG   | No cookies, `localStorage`, `sessionStorage`, or IndexedDB       |
| Workers                       |   NG   | No dedicated, shared, or service workers                         |
| Media playback               |   NG   | Media elements expose DOM interfaces but do not decode or play   |
| Canvas and graphics          |   NG   | No canvas drawing context, WebGL, or WebGPU                      |
| Browser automation          |   NG   | No tabs, user interaction model, accessibility tree, or screenshots |

## Package selection

The capability table describes the full `palim` package. Applications that need
only part of the stack can use the narrower packages described in the
[repository README](../README.md#packages):

- `@palim/core` for parsing and DOM APIs.
- `@palim/window` for a scriptless Window environment.
- `@palim/scripting` for engine-independent realm binding and script processing.
- `@palim/engine262` for the engine262 backend.
