# palim

**A lightweight, standards-compliant HTML and DOM implementation for JavaScript.**

palim is an experimental HTML and DOM implementation focused on three goals:

- **Faster** — Minimize parsing and DOM operation overhead.
- **Lighter** — Reduce memory consumption, especially when processing many documents.
- **More compliant** — Follow web standards and verify interoperability through established test suites.

## Philosophy

Modern HTML processing libraries often fall into two categories: lightweight parsers with limited DOM support, and comprehensive browser-like environments with considerable runtime overhead.

palim aims to explore the space between them.

The project is built around a simple principle: **pay only for the capabilities you need.**

Parsing an HTML document should not require an entire browser environment. At the same time, choosing a lightweight parser should not mean abandoning standards compliance or the possibility of browser-compatible behavior.

palim aims to provide a foundation that can grow from HTML parsing and DOM manipulation toward a more complete browser-like environment, without making every layer mandatory.

## Goals

### Standards compliance

Implement HTML parsing and DOM behavior according to the relevant WHATWG and W3C specifications.

Use established interoperability tests, including:

- [html5lib-tests](https://github.com/html5lib/html5lib-tests)
- [Web Platform Tests (WPT)](https://github.com/web-platform-tests/wpt)

Test results are evidence of compatibility, not a substitute for specifications. Discrepancies between specifications, test suites, and implementations should be investigated explicitly.

### Performance and memory efficiency

Evaluate performance against existing implementations such as jsdom, parse5, and other relevant libraries.

Optimize for practical workloads, including processing large numbers of independent HTML documents.

Performance improvements should be measurable and reproducible, not merely assumed.

### Incremental capabilities

Build functionality in layers, from basic document parsing to increasingly browser-compatible APIs.

The intended progression includes:

1. HTML parsing and DOM tree construction.
2. Standard DOM interfaces and element-specific APIs.
3. Document traversal, querying, and manipulation.
4. Browser-related APIs and a `Window` environment.
5. Optional JavaScript execution and further browser emulation.

These are development goals, not a commitment to complete browser compatibility.

## Intended API

The following illustrates the intended API, not necessarily the current implementation.

```js
import { DOMParser } from "@palim/core";

const document = new DOMParser().parseFromString(
  "<html><body><h1>Hello, world!</h1></body></html>",
  "text/html",
);

console.log(document.querySelector("h1")?.textContent);
```

Eventually, palim may also provide a browser-like environment through a host object outside the page realm:

```js
import { open } from "palim";

const context = await open({
  html: "<h1>Hello, world!</h1>",
  baseURL: "https://example.test/",
});

console.log(context.window.document.querySelector("h1")?.textContent);
```

Passing a URL directly loads the initial document from that URL:

```js
const context = await open("https://example.test/");
```

Scripting is disabled unless it is explicitly enabled:

```js
const context = await open("https://example.test/", {
  scripting: "enabled",
});
```

The goal is to make these capabilities coexist without requiring applications that only need HTML parsing to pay the cost of a full browser environment.

## Packages

- `@palim/core` provides DOMParser and the DOM implementation required by parsed documents. It does not include Window, resource loading, JavaScript realm binding, or engine262.
- `@palim/window` adds a Window environment and resource loading without scripting or engine262.
- `@palim/scripting` provides engine-independent realm binding and script processing.
- `@palim/engine262` provides the engine262 backend and is the only package that depends on engine262.
- `palim` provides the full browser-like environment and re-exports DOMParser from `@palim/core`.

## Capability matrix

This table summarizes the current capabilities of the full `palim` package.
`OK` means there is a usable implementation, not that every specification
requirement is implemented. `Partial` means that a narrower subset is available,
and `NG` means that the capability is not currently provided.

| Capability                         | Status  | Current scope                                                                 |
| ---------------------------------- | :-----: | ----------------------------------------------------------------------------- |
| HTML and XML DOM parsing           |   OK    | Document and fragment parsing, DOM construction, and serialization            |
| DOM tree APIs                      |   OK    | Queries, mutation, traversal, ranges, events, and mutation observers          |
| CSS selectors                      |   OK    | Selector matching and `querySelector`-family APIs                             |
| Window environment                 |   OK    | `open()` creates a `Window` and its active `Document`                         |
| JavaScript scripting               |   OK    | Opt-in inline and external classic scripts; disabled by default               |
| Document and subresource loading   | Partial | Initial documents and selected subresources, without a full browser lifecycle |
| `iframe`                           | Partial | Child documents, Window relationships, `src`/`srcdoc`, load events, and classic scripts; without sandbox or cross-origin enforcement |
| Shadow DOM and custom elements     | Partial | Core tree, registry, and reaction behavior; platform coverage remains limited |
| CSS stylesheets, cascade, and layout |   NG    | Inline style declarations exist, but style calculation and layout do not      |
| JavaScript modules                 |   NG    | Module scripts are not executed                                               |
| Navigation and session history     |   NG    | No complete navigation or history model                                       |
| Rendering and painting             |   NG    | No visual rendering pipeline                                                  |

This is a qualitative feature map. Quantitative interoperability results belong
in the [WPT progress report](./reports/wpt/report.md). See
[Capability details](./docs/capabilities.md) for a more detailed breakdown.

## Project status

**Experimental — under active development.**

The public API, internal architecture, and supported standards are subject to change.

Features described in the roadmap should not be assumed to be implemented.

## Development

The project requires Node.js 24 and npm 12.
The Node.js version is pinned in `.tool-versions` for asdf and/or nodenv users.

```sh
npm install
npm run check
```

`npm run check` verifies formatting, lint rules, types, tests, and the package build.

The default WPT scope can be executed as a resumable campaign. A campaign runs
one test URL per worker with ten workers by default and periodically updates the
WPT progress report.

```sh
npm run wpt:test -- --campaign
```

The command prints its campaign ID. Resume an interrupted campaign without
rerunning completed URLs by passing that ID:

```sh
npm run wpt:test -- --campaign --resume <campaign-id>
```

## Name

**Pronounced:** *pah-lim* (ぱりむ)

palim takes its name from *palimpsest* — a manuscript that has been written over while retaining traces of earlier writing.

The name reflects the idea of rebuilding on accumulated knowledge, revisiting assumptions, and refining implementations through repeated examination.

## License

MIT
