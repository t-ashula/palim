import { open } from "../../dist/index.js";

const url = process.argv[2];

if (url === undefined) {
  throw new TypeError("A test URL is required.");
}

await open(url);
