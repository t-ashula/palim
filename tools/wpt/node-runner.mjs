import { open } from "../../dist/index.js";

const url = process.argv[2];

if (url === undefined) {
  throw new TypeError("A test URL is required.");
}

const { window } = await open(url);
let failed = false;

window.onerror((error) => {
  failed = true;
  process.stderr.write(
    `${error.stack ?? `${error.message}\n    at ${error.url}`}\n`,
  );
});

if (failed) {
  process.exitCode = 1;
}
