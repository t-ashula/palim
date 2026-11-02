import { readFileSync, writeFileSync } from "node:fs";

const [combiningInput, joiningInput, bidiInput, output] = process.argv.slice(2);
if (
  combiningInput === undefined ||
  joiningInput === undefined ||
  bidiInput === undefined ||
  output === undefined
) {
  throw new TypeError(
    "usage: generate-idna-properties.mjs COMBINING JOINING BIDI OUTPUT",
  );
}

function entries(file, includedProperties = null) {
  const output = [];
  for (const sourceLine of readFileSync(file, "utf8").split("\n")) {
    const line = sourceLine.split("#", 1)[0]?.trim() ?? "";
    if (line === "") {
      continue;
    }
    const [rangeSource = "", property = ""] = line
      .split(";")
      .map((part) => part.trim());
    if (includedProperties !== null && !includedProperties.has(property)) {
      continue;
    }
    const [startSource = "", endSource = startSource] = rangeSource.split("..");
    output.push({
      start: Number.parseInt(startSource, 16),
      end: Number.parseInt(endSource, 16),
      property,
    });
  }
  return output.toSorted((left, right) => left.start - right.start);
}

function ranges(file, includedProperties = null) {
  return entries(file, includedProperties).map(({ start, end }) => ({
    start,
    end,
  }));
}

function propertyRanges(file) {
  return entries(file).map(({ start, end, property }) => ({
    start,
    end,
    value: property,
  }));
}

const data = {
  viramaRanges: ranges(combiningInput, new Set(["9"])),
  joiningTypeRanges: propertyRanges(joiningInput),
  bidiClassRanges: propertyRanges(bidiInput),
};
writeFileSync(output, JSON.stringify(data));
