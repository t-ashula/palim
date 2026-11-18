import type { Window } from "./window.js";

export class Navigator {
  readonly userAgent = "palim";
  readonly onLine = true;
}

const WINDOW_NAVIGATORS = new WeakMap<object, Navigator>();

export function windowNavigator(window: Window): Navigator {
  let navigator = WINDOW_NAVIGATORS.get(window);
  if (navigator === undefined) {
    navigator = new Navigator();
    WINDOW_NAVIGATORS.set(window, navigator);
  }
  return navigator;
}
