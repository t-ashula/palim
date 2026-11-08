# palim

A lightweight, standards-compliant HTML and DOM implementation for JavaScript.

`open()` creates a Window with scripting disabled by default. Enable page scripts explicitly:

```js
import { open } from "palim";

const { window } = await open(
  { html: "<script>document.title = 'ready'</script>" },
  { scripting: "enabled" },
);
```

See the [palim repository](https://github.com/t-ashula/palim) for documentation, development instructions, and project status.
