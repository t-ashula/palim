import { writeFileSync } from "node:fs";

import { runReadabilityCase } from "./readability-case.js";

const fixtureDirectory = process.argv[2];
if (fixtureDirectory === undefined) {
  throw new Error("Readability fixture directory is required");
}
const output = process.argv[3];
if (output === undefined) {
  throw new Error("Readability result output path is required");
}

writeFileSync(
  output,
  `${JSON.stringify(runReadabilityCase(fixtureDirectory))}\n`,
);
