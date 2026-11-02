if (typeof URL !== "function" || URL.length !== 1 || webkitURL !== URL) {
  throw new Error("URL constructor is invalid");
}
const descriptor = Object.getOwnPropertyDescriptor(globalThis, "URL");
if (descriptor.enumerable || !descriptor.configurable || !descriptor.writable) {
  throw new Error("URL global descriptor is invalid");
}

const url = new URL("../path?first=1#hash", "https://example.test/base/");
if (
  !(url instanceof URL) ||
  Object.getPrototypeOf(url) !== URL.prototype ||
  Object.prototype.toString.call(url) !== "[object URL]" ||
  url.href !== "https://example.test/path?first=1#hash"
) {
  throw new Error("URL platform object is invalid");
}
if (
  !URL.canParse("/next", url) ||
  URL.canParse("http://[") ||
  URL.parse("http://[") !== null ||
  URL.parse("/next", url).href !== "https://example.test/next"
) {
  throw new Error("URL static operations are invalid");
}

const params = url.searchParams;
if (
  params !== url.searchParams ||
  !(params instanceof URLSearchParams) ||
  Object.getPrototypeOf(params) !== URLSearchParams.prototype
) {
  throw new Error("URLSearchParams identity is invalid");
}
params.append("second", "two words");
if (url.search !== "?first=1&second=two+words") {
  throw new Error("URLSearchParams did not update URL");
}
url.search = "?replacement=3";
if (params.toString() !== "replacement=3") {
  throw new Error("URL did not update URLSearchParams");
}
url.pathname = "/changed";
url.hash = "done";
if (
  String(url) !== "https://example.test/changed?replacement=3#done" ||
  url.toJSON() !== String(url) ||
  JSON.stringify(url) !== JSON.stringify(String(url))
) {
  throw new Error("URL serialization is invalid");
}
