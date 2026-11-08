# @palim/window

The Window package for palim. It provides `open()` without JavaScript scripting or an engine backend.

```js
import { open } from "@palim/window";

const { window } = await open({ html: "<h1>Hello</h1>" });
```

The `open()` API is the same as the full package. Passing `{ scripting: "enabled" }` rejects because this package does not include scripting.
