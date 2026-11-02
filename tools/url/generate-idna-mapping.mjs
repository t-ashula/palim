import { readFileSync, writeFileSync } from "node:fs";

const [input, output] = process.argv.slice(2);
if (input === undefined || output === undefined) {
  throw new TypeError("usage: generate-idna-mapping.mjs INPUT OUTPUT");
}

const statuses = new Set([
  "valid",
  "mapped",
  "ignored",
  "deviation",
  "disallowed",
]);
const entries = [];
for (const sourceLine of readFileSync(input, "utf8").split("\n")) {
  const line = sourceLine.split("#", 1)[0]?.trim() ?? "";
  if (line === "") {
    continue;
  }
  const [rangeSource = "", status = "", mappingSource = ""] = line
    .split(";")
    .map((part) => part.trim());
  const [startSource = "", endSource = startSource] = rangeSource.split("..");
  if (!statuses.has(status)) {
    throw new TypeError(`unsupported IDNA status: ${status}`);
  }
  entries.push({
    start: Number.parseInt(startSource, 16),
    end: Number.parseInt(endSource, 16),
    status,
    mapping: mappingSource
      .split(/\s+/u)
      .filter(Boolean)
      .map((point) => Number.parseInt(point, 16)),
  });
}

writeFileSync(output, JSON.stringify(entries));
