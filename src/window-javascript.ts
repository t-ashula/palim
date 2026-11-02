import { Engine262Adapter } from "./javascript-engine/engine262-adapter.js";
import { WindowScriptEnvironment } from "./javascript-engine/window-classic-script.js";
import { Window } from "./window.js";
import type { WindowOptions } from "./window.js";

export {
  ClassicScript,
  WindowEnvironmentSettings,
} from "./javascript-engine/window-classic-script.js";

export type WindowExecutionOptions = WindowOptions;

export class WindowExecutionEnvironment extends WindowScriptEnvironment {
  constructor(options: WindowExecutionOptions = {}) {
    super(new Engine262Adapter(), new Window(options));
  }
}
