# @palim/core

The parser-only package for palim. It exports DOMParser without the Window environment, resource loading, JavaScript realm binding, or a JavaScript engine backend.

```js
import { DOMParser } from "@palim/core";

const document = new DOMParser().parseFromString("<p>Hello</p>", "text/html");
```

See the [palim repository](https://github.com/t-ashula/palim) for development instructions and project status.
