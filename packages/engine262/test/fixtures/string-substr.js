const descriptor = Object.getOwnPropertyDescriptor(String.prototype, "substr");
if (
  descriptor === undefined ||
  descriptor.enumerable ||
  !descriptor.configurable ||
  !descriptor.writable ||
  descriptor.value.name !== "substr" ||
  descriptor.value.length !== 2
) {
  throw new Error("String.prototype.substr has invalid property metadata");
}

const cases = [
  ["abcdef".substr(2), "cdef"],
  ["abcdef".substr(2, 2), "cd"],
  ["abcdef".substr(-2), "ef"],
  ["abcdef".substr(-Infinity, 2), "ab"],
  ["abcdef".substr(Infinity), ""],
  ["abcdef".substr(1, -1), ""],
  [String.prototype.substr.call(12345, 1, 2), "23"],
];
for (const [actual, expected] of cases) {
  if (actual !== expected) {
    throw new Error(`String.prototype.substr returned ${actual}`);
  }
}

let rejectedNull = false;
try {
  String.prototype.substr.call(null, 0);
} catch (error) {
  rejectedNull = error instanceof TypeError;
}
if (!rejectedNull) {
  throw new Error("String.prototype.substr accepted a null receiver");
}
