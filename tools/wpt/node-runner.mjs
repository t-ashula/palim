import { open } from "../../packages/palim/dist/index.js";

const url = process.argv[2];
const resultPrefix = "ALERT: RESULT: ";

if (url === undefined) {
  throw new TypeError("A test URL is required.");
}

let failed = false;
let resultSeen = false;
const hostLog = console.log.bind(console);

console.log = (...data) => {
  hostLog(...data);
  if (typeof data[0] === "string" && data[0].startsWith(resultPrefix)) {
    resultSeen = true;
    process.stdout.write("", () => process.exit(0));
  }
};

const { window } = await open(url, { scripting: "enabled" });

window.onerror((error) => {
  failed = true;
  process.stderr.write(
    `${error.stack ?? `${error.message}\n    at ${error.url}`}\n`,
  );
});

process.exitCode = resultSeen ? 0 : failed ? 1 : 0;
