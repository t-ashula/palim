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
import { DOMParser } from "palim";

const document = new DOMParser().parseFromString(
  "<html><body><h1>Hello, world!</h1></body></html>",
  "text/html",
);

console.log(document.querySelector("h1")?.textContent);
```

Eventually, palim may also provide a browser-like environment:

```js
import { Window } from "palim";

const window = new Window({
  url: "https://example.com/",
});
```

The goal is to make these capabilities coexist without requiring applications that only need HTML parsing to pay the cost of a full browser environment.

## Project status

**Experimental — under active development.**

The public API, internal architecture, and supported standards are subject to change.

Features described in the roadmap should not be assumed to be implemented.

## Name

**Pronounced:** *pah-lim* (ぱりむ)

palim takes its name from *palimpsest* — a manuscript that has been written over while retaining traces of earlier writing.

The name reflects the idea of rebuilding on accumulated knowledge, revisiting assumptions, and refining implementations through repeated examination.

## License

MIT
