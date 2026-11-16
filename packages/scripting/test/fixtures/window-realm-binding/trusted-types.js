const factory = trustedTypes;
if (factory !== trustedTypes) {
  throw new Error("trustedTypes identity changed");
}
if (factory.defaultPolicy !== null) {
  throw new Error("defaultPolicy was initialized before policy creation");
}

const calls = [];
const policy = factory.createPolicy("default", {
  createHTML(input, suffix) {
    calls.push([input, suffix]);
    return `<p>${input}${suffix}</p>`;
  },
  createScript(input) {
    return input;
  },
  createScriptURL(input) {
    return input;
  },
  createParserOptions(input) {
    return input;
  },
});

const html = policy.createHTML("content", "!");
const script = policy.createScript("run()");
const scriptURL = policy.createScriptURL("/script.js");
const parserOptions = policy.createParserOptions({ runScripts: false });

if (factory.defaultPolicy !== policy) {
  throw new Error("defaultPolicy did not return the created policy");
}
if (policy.name !== "default") {
  throw new Error("policy name was not exposed");
}
if (String(html) !== "<p>content!</p>" || html.toJSON() !== String(html)) {
  throw new Error("TrustedHTML did not expose its callback result");
}
if (!factory.isHTML(html) || !factory.isScript(script)) {
  throw new Error("factory did not recognize typed values");
}
if (!factory.isScriptURL(scriptURL)) {
  throw new Error("factory did not recognize TrustedScriptURL");
}
if (!factory.isHTMLParserOptions(parserOptions)) {
  throw new Error("factory did not recognize TrustedHTMLParserOptions");
}
if (
  Object.getOwnPropertyNames(TrustedHTMLParserOptions.prototype).join(",") !==
  "constructor"
) {
  throw new Error("TrustedHTMLParserOptions exposes public members");
}
if (factory.isHTML({ toString: html.toString })) {
  throw new Error("factory accepted a spoofed TrustedHTML");
}
if (Object.prototype.toString.call(html) !== "[object TrustedHTML]") {
  throw new Error("TrustedHTML has the wrong toStringTag");
}
if (calls.length !== 1 || calls[0][0] !== "content" || calls[0][1] !== "!") {
  throw new Error("policy callback arguments were not preserved");
}

const thrown = { page: "failure" };
const failingPolicy = factory.createPolicy("failure", {
  createHTML() {
    throw thrown;
  },
});
let caught;
try {
  failingPolicy.createHTML("content");
} catch (error) {
  caught = error;
}
if (caught !== thrown) {
  throw new Error("policy callback exception escaped the page call");
}

if (!(factory.createPolicy("failure", {}) instanceof TrustedTypePolicy)) {
  throw new Error("duplicate non-default policy name was rejected");
}

let duplicateDefaultRejected = false;
try {
  factory.createPolicy("default", {});
} catch (error) {
  duplicateDefaultRejected = error instanceof TypeError;
}
if (!duplicateDefaultRejected) {
  throw new Error("duplicate default policy was accepted");
}

const invalidParserOptionsPolicy = factory.createPolicy("invalid-options", {
  createParserOptions() {
    return null;
  },
});
let invalidParserOptionsRejected = false;
try {
  invalidParserOptionsPolicy.createParserOptions({});
} catch (error) {
  invalidParserOptionsRejected = error instanceof TypeError;
}
if (!invalidParserOptionsRejected) {
  throw new Error("non-object parser options were accepted");
}
