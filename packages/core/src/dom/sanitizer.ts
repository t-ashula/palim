import {
  GLOBAL_EVENT_HANDLER_NAMES,
  WINDOW_EVENT_HANDLER_NAMES,
} from "../event-handler-names.js";
import {
  HTML_NAMESPACE,
  MATHML_NAMESPACE,
  SVG_NAMESPACE,
  XLINK_NAMESPACE,
} from "../namespaces.js";

export interface SanitizerName {
  readonly name: string;
  readonly namespace?: string | null;
}

export interface SanitizerElementWithAttributes extends SanitizerName {
  readonly attributes?: readonly SanitizerAttribute[];
  readonly removeAttributes?: readonly SanitizerAttribute[];
}

export interface SanitizerProcessingInstruction {
  readonly target: string;
}

export type SanitizerElement = string | SanitizerName;
export type SanitizerElementInput = string | SanitizerElementWithAttributes;
export type SanitizerAttribute = string | SanitizerName;
export type SanitizerPI = string | SanitizerProcessingInstruction;

export interface SanitizerConfig {
  readonly attributes?: readonly SanitizerAttribute[];
  readonly comments?: boolean;
  readonly dataAttributes?: boolean;
  readonly elements?: readonly SanitizerElementInput[];
  readonly javascriptURLs?: boolean;
  readonly processingInstructions?: readonly SanitizerPI[];
  readonly removeAttributes?: readonly SanitizerAttribute[];
  readonly removeElements?: readonly SanitizerElement[];
  readonly removeProcessingInstructions?: readonly SanitizerPI[];
  readonly replaceWithChildrenElements?: readonly SanitizerElement[];
}

export interface CanonicalSanitizerName {
  readonly name: string;
  readonly namespace: string | null;
}

export interface CanonicalSanitizerElement extends CanonicalSanitizerName {
  readonly attributes?: CanonicalSanitizerName[];
  readonly removeAttributes?: CanonicalSanitizerName[];
}

export interface CanonicalSanitizerPI {
  readonly target: string;
}

export interface CanonicalSanitizerConfig {
  attributes?: CanonicalSanitizerName[];
  comments: boolean;
  dataAttributes?: boolean;
  elements?: CanonicalSanitizerElement[];
  javascriptURLs: boolean;
  processingInstructions?: CanonicalSanitizerPI[];
  removeAttributes?: CanonicalSanitizerName[];
  removeElements?: CanonicalSanitizerName[];
  removeProcessingInstructions?: CanonicalSanitizerPI[];
  replaceWithChildrenElements?: CanonicalSanitizerName[];
}

const nameKey = (value: CanonicalSanitizerName): string =>
  `${value.namespace ?? ""}\u0000${value.name}`;

const sameName = (
  left: CanonicalSanitizerName,
  right: CanonicalSanitizerName,
): boolean => left.name === right.name && left.namespace === right.namespace;

function canonicalName(
  value: SanitizerAttribute | SanitizerElement,
  defaultNamespace: string | null,
): CanonicalSanitizerName {
  if (typeof value === "string") {
    return { name: value, namespace: defaultNamespace };
  }
  return {
    name: value.name,
    namespace:
      value.namespace === ""
        ? null
        : value.namespace === undefined
          ? defaultNamespace
          : value.namespace,
  };
}

function canonicalElement(
  value: SanitizerElementInput,
): CanonicalSanitizerElement {
  const name = canonicalName(value, HTML_NAMESPACE);
  if (typeof value === "string") {
    return { ...name, removeAttributes: [] };
  }
  if (value.attributes !== undefined && value.removeAttributes !== undefined) {
    throw new TypeError("Invalid SanitizerConfig");
  }
  if (value.attributes !== undefined) {
    return {
      ...name,
      attributes: value.attributes.map((item) => canonicalName(item, null)),
    };
  }
  return {
    ...name,
    removeAttributes: (value.removeAttributes ?? []).map((item) =>
      canonicalName(item, null),
    ),
  };
}

function canonicalPI(value: SanitizerPI): CanonicalSanitizerPI {
  return { target: typeof value === "string" ? value : value.target };
}

function cloneConfig(
  config: CanonicalSanitizerConfig,
): CanonicalSanitizerConfig {
  const cloneNames = (
    values: readonly CanonicalSanitizerName[],
  ): CanonicalSanitizerName[] => values.map((value) => ({ ...value }));
  const clonePIs = (
    values: readonly CanonicalSanitizerPI[],
  ): CanonicalSanitizerPI[] => values.map((value) => ({ ...value }));
  const result: CanonicalSanitizerConfig = { ...config };
  if (config.elements !== undefined) {
    result.elements = config.elements.map((element) => ({
      name: element.name,
      namespace: element.namespace,
      ...(element.attributes === undefined
        ? {}
        : { attributes: element.attributes.map((value) => ({ ...value })) }),
      ...(element.removeAttributes === undefined
        ? {}
        : {
            removeAttributes: element.removeAttributes.map((value) => ({
              ...value,
            })),
          }),
    }));
  }
  if (config.removeElements !== undefined) {
    result.removeElements = cloneNames(config.removeElements);
  }
  if (config.replaceWithChildrenElements !== undefined) {
    result.replaceWithChildrenElements = cloneNames(
      config.replaceWithChildrenElements,
    );
  }
  if (config.attributes !== undefined) {
    result.attributes = cloneNames(config.attributes);
  }
  if (config.removeAttributes !== undefined) {
    result.removeAttributes = cloneNames(config.removeAttributes);
  }
  if (config.processingInstructions !== undefined) {
    result.processingInstructions = clonePIs(config.processingInstructions);
  }
  if (config.removeProcessingInstructions !== undefined) {
    result.removeProcessingInstructions = clonePIs(
      config.removeProcessingInstructions,
    );
  }
  return result;
}

function hasDuplicateNames(values: readonly CanonicalSanitizerName[]): boolean {
  return new Set(values.map(nameKey)).size !== values.length;
}

function hasDuplicateTargets(values: readonly CanonicalSanitizerPI[]): boolean {
  return new Set(values.map((value) => value.target)).size !== values.length;
}

function intersects(
  left: readonly CanonicalSanitizerName[],
  right: readonly CanonicalSanitizerName[],
): boolean {
  const keys = new Set(left.map(nameKey));
  return right.some((value) => keys.has(nameKey(value)));
}

function isSubset(
  subset: readonly CanonicalSanitizerName[],
  superset: readonly CanonicalSanitizerName[],
): boolean {
  const keys = new Set(superset.map(nameKey));
  return subset.every((value) => keys.has(nameKey(value)));
}

const NON_REPLACEABLE_ELEMENTS: readonly CanonicalSanitizerName[] = [
  { name: "html", namespace: HTML_NAMESPACE },
  { name: "svg", namespace: SVG_NAMESPACE },
  { name: "math", namespace: MATHML_NAMESPACE },
];

function validConfig(config: CanonicalSanitizerConfig): boolean {
  if (
    (config.elements === undefined) === (config.removeElements === undefined) ||
    (config.attributes === undefined) ===
      (config.removeAttributes === undefined) ||
    (config.processingInstructions === undefined) ===
      (config.removeProcessingInstructions === undefined)
  ) {
    return false;
  }
  const elementList = config.elements ?? config.removeElements ?? [];
  const attributeList = config.attributes ?? config.removeAttributes ?? [];
  const piList =
    config.processingInstructions ?? config.removeProcessingInstructions ?? [];
  if (
    hasDuplicateNames(elementList) ||
    hasDuplicateNames(attributeList) ||
    hasDuplicateTargets(piList) ||
    hasDuplicateNames(config.replaceWithChildrenElements ?? [])
  ) {
    return false;
  }
  const replaced = config.replaceWithChildrenElements ?? [];
  if (
    replaced.some((value) =>
      NON_REPLACEABLE_ELEMENTS.some((item) => sameName(value, item)),
    ) ||
    intersects(elementList, replaced)
  ) {
    return false;
  }
  if (config.elements !== undefined) {
    for (const element of config.elements) {
      const allowed = element.attributes;
      const removed = element.removeAttributes;
      if (
        (allowed !== undefined && hasDuplicateNames(allowed)) ||
        (removed !== undefined && hasDuplicateNames(removed))
      ) {
        return false;
      }
      if (config.attributes !== undefined) {
        if (
          intersects(config.attributes, allowed ?? []) ||
          !isSubset(removed ?? [], config.attributes)
        ) {
          return false;
        }
        if (
          config.dataAttributes === true &&
          [...config.attributes, ...(allowed ?? [])].some(isDataAttribute)
        ) {
          return false;
        }
      } else if (
        (allowed !== undefined && removed !== undefined) ||
        intersects(config.removeAttributes ?? [], allowed ?? []) ||
        intersects(config.removeAttributes ?? [], removed ?? [])
      ) {
        return false;
      }
    }
  }
  if (
    config.removeAttributes !== undefined &&
    config.dataAttributes !== undefined
  ) {
    return false;
  }
  if (
    config.attributes !== undefined &&
    config.dataAttributes === true &&
    config.attributes.some(isDataAttribute)
  ) {
    return false;
  }
  return true;
}

function canonicalizeConfig(
  input: SanitizerConfig,
  permissiveDefaults: boolean,
): CanonicalSanitizerConfig {
  const config: CanonicalSanitizerConfig = {
    comments: input.comments ?? permissiveDefaults,
    javascriptURLs: input.javascriptURLs ?? permissiveDefaults,
  };
  if (input.elements !== undefined && input.removeElements !== undefined) {
    throw new TypeError("Invalid SanitizerConfig");
  }
  if (input.elements !== undefined) {
    config.elements = input.elements.map(canonicalElement);
  } else {
    config.removeElements = (input.removeElements ?? []).map((value) =>
      canonicalName(value, HTML_NAMESPACE),
    );
  }
  if (input.attributes !== undefined && input.removeAttributes !== undefined) {
    throw new TypeError("Invalid SanitizerConfig");
  }
  if (input.attributes !== undefined) {
    config.attributes = input.attributes.map((value) =>
      canonicalName(value, null),
    );
    config.dataAttributes = input.dataAttributes ?? permissiveDefaults;
  } else {
    config.removeAttributes = (input.removeAttributes ?? []).map((value) =>
      canonicalName(value, null),
    );
    if (input.dataAttributes !== undefined) {
      config.dataAttributes = input.dataAttributes;
    }
  }
  if (
    input.processingInstructions !== undefined &&
    input.removeProcessingInstructions !== undefined
  ) {
    throw new TypeError("Invalid SanitizerConfig");
  }
  if (input.processingInstructions !== undefined) {
    config.processingInstructions =
      input.processingInstructions.map(canonicalPI);
  } else if (
    input.removeProcessingInstructions !== undefined ||
    permissiveDefaults
  ) {
    config.removeProcessingInstructions = (
      input.removeProcessingInstructions ?? []
    ).map(canonicalPI);
  } else {
    config.processingInstructions = [];
  }
  if (input.replaceWithChildrenElements !== undefined) {
    config.replaceWithChildrenElements = input.replaceWithChildrenElements.map(
      (value) => canonicalName(value, HTML_NAMESPACE),
    );
  }
  if (!validConfig(config)) {
    throw new TypeError("Invalid SanitizerConfig");
  }
  return config;
}

const EVENT_HANDLER_ATTRIBUTES = [
  ...GLOBAL_EVENT_HANDLER_NAMES,
  ...WINDOW_EVENT_HANDLER_NAMES,
].map((name) => ({ name: `on${name}`, namespace: null }));

const SAFE_BASELINE_ELEMENTS: readonly CanonicalSanitizerName[] = [
  "base",
  "embed",
  "frame",
  "iframe",
  "object",
  "script",
]
  .map((name) => ({ name, namespace: HTML_NAMESPACE }))
  .concat([
    { name: "script", namespace: SVG_NAMESPACE },
    { name: "use", namespace: SVG_NAMESPACE },
  ]);

function elementList(
  namespace: string,
  names: readonly string[],
  attributes: Readonly<Record<string, readonly string[]>> = {},
): CanonicalSanitizerElement[] {
  return names.map((name) => ({
    name,
    namespace,
    attributes: (attributes[name] ?? []).map((attribute) => ({
      name: attribute,
      namespace: null,
    })),
  }));
}

const MATH_ELEMENTS = [
  "a",
  "math",
  "merror",
  "mfrac",
  "mi",
  "mmultiscripts",
  "mn",
  "mo",
  "mover",
  "mpadded",
  "mphantom",
  "mprescripts",
  "mroot",
  "mrow",
  "ms",
  "mspace",
  "msqrt",
  "mstyle",
  "msub",
  "msubsup",
  "msup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munder",
  "munderover",
  "semantics",
];
const MATH_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
  a: ["href", "hreflang", "type"],
  mo: [
    "fence",
    "form",
    "largeop",
    "lspace",
    "maxsize",
    "minsize",
    "movablelimits",
    "rspace",
    "separator",
    "stretchy",
    "symmetric",
  ],
  mover: ["accent"],
  mpadded: ["depth", "height", "lspace", "voffset", "width"],
  mspace: ["depth", "height", "width"],
  mtd: ["columnspan", "rowspan"],
  munder: ["accentunder"],
  munderover: ["accent", "accentunder"],
};
const HTML_ELEMENTS = [
  "a",
  "abbr",
  "address",
  "article",
  "aside",
  "b",
  "bdi",
  "bdo",
  "blockquote",
  "body",
  "br",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "dd",
  "del",
  "dfn",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "ins",
  "kbd",
  "li",
  "main",
  "mark",
  "menu",
  "nav",
  "ol",
  "p",
  "pre",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "search",
  "section",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "u",
  "ul",
  "var",
  "wbr",
];
const HTML_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
  a: ["href", "hreflang", "type"],
  blockquote: ["cite"],
  col: ["span"],
  colgroup: ["span"],
  data: ["value"],
  del: ["cite", "datetime"],
  ins: ["cite", "datetime"],
  li: ["value"],
  ol: ["reversed", "start", "type"],
  td: ["colspan", "headers", "rowspan"],
  th: ["abbr", "colspan", "headers", "rowspan", "scope"],
  time: ["datetime"],
};
const SVG_ELEMENTS = [
  "a",
  "circle",
  "defs",
  "desc",
  "ellipse",
  "foreignObject",
  "g",
  "line",
  "marker",
  "metadata",
  "path",
  "polygon",
  "polyline",
  "rect",
  "svg",
  "text",
  "textPath",
  "title",
  "tspan",
];
const SVG_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
  a: ["href", "hreflang", "type"],
  circle: ["cx", "cy", "pathLength", "r"],
  ellipse: ["cx", "cy", "pathLength", "rx", "ry"],
  foreignObject: ["height", "width", "x", "y"],
  line: ["pathLength", "x1", "x2", "y1", "y2"],
  marker: [
    "markerHeight",
    "markerUnits",
    "markerWidth",
    "orient",
    "preserveAspectRatio",
    "refX",
    "refY",
    "viewBox",
  ],
  path: ["d", "pathLength"],
  polygon: ["pathLength", "points"],
  polyline: ["pathLength", "points"],
  rect: ["height", "pathLength", "rx", "ry", "width", "x", "y"],
  svg: ["height", "preserveAspectRatio", "viewBox", "width", "x", "y"],
  text: ["dx", "dy", "lengthAdjust", "rotate", "textLength", "x", "y"],
  textPath: [
    "lengthAdjust",
    "method",
    "path",
    "side",
    "spacing",
    "startOffset",
    "textLength",
  ],
  tspan: ["dx", "dy", "lengthAdjust", "rotate", "textLength", "x", "y"],
};
const GLOBAL_ATTRIBUTES = [
  "alignment-baseline",
  "baseline-shift",
  "clip-path",
  "clip-rule",
  "color",
  "color-interpolation",
  "cursor",
  "dir",
  "direction",
  "display",
  "displaystyle",
  "dominant-baseline",
  "fill",
  "fill-opacity",
  "fill-rule",
  "font-family",
  "font-size",
  "font-size-adjust",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-weight",
  "lang",
  "letter-spacing",
  "marker-end",
  "marker-mid",
  "marker-start",
  "mathbackground",
  "mathcolor",
  "mathsize",
  "opacity",
  "paint-order",
  "pointer-events",
  "scriptlevel",
  "shape-rendering",
  "stop-color",
  "stop-opacity",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "text-anchor",
  "text-decoration",
  "text-overflow",
  "text-rendering",
  "title",
  "transform",
  "transform-origin",
  "unicode-bidi",
  "vector-effect",
  "visibility",
  "white-space",
  "word-spacing",
  "writing-mode",
];

const DEFAULT_CONFIG: CanonicalSanitizerConfig = {
  elements: [
    ...elementList(MATHML_NAMESPACE, MATH_ELEMENTS, MATH_ATTRIBUTES),
    ...elementList(HTML_NAMESPACE, HTML_ELEMENTS, HTML_ATTRIBUTES),
    ...elementList(SVG_NAMESPACE, SVG_ELEMENTS, SVG_ATTRIBUTES),
  ],
  processingInstructions: [],
  attributes: GLOBAL_ATTRIBUTES.map((name) => ({ name, namespace: null })),
  comments: false,
  dataAttributes: false,
  javascriptURLs: false,
};

export class Sanitizer {
  #configuration: CanonicalSanitizerConfig;

  constructor(configuration: SanitizerConfig | "default" | null = "default") {
    this.#configuration =
      configuration === "default"
        ? cloneConfig(DEFAULT_CONFIG)
        : canonicalizeConfig(configuration ?? {}, true);
  }

  static fromConfiguration(
    configuration: SanitizerConfig | CanonicalSanitizerConfig,
    permissiveDefaults: boolean,
  ): Sanitizer {
    const sanitizer = new Sanitizer({});
    sanitizer.#configuration = canonicalizeConfig(
      configuration,
      permissiveDefaults,
    );
    return sanitizer;
  }

  configuration(): CanonicalSanitizerConfig {
    return cloneConfig(this.#configuration);
  }

  get(): CanonicalSanitizerConfig {
    const config = this.configuration();
    const compare = (
      left: CanonicalSanitizerName,
      right: CanonicalSanitizerName,
    ) =>
      (left.namespace ?? "").localeCompare(right.namespace ?? "") ||
      left.name.localeCompare(right.name);
    config.elements?.sort(compare);
    for (const element of config.elements ?? []) {
      element.attributes?.sort(compare);
      element.removeAttributes?.sort(compare);
    }
    config.removeElements?.sort(compare);
    config.replaceWithChildrenElements?.sort(compare);
    config.attributes?.sort(compare);
    config.removeAttributes?.sort(compare);
    config.processingInstructions?.sort((a, b) =>
      a.target.localeCompare(b.target),
    );
    config.removeProcessingInstructions?.sort((a, b) =>
      a.target.localeCompare(b.target),
    );
    return config;
  }

  allowElement(value: SanitizerElementInput): boolean {
    const element = canonicalElement(value);
    let changed = removeName(
      this.#configuration.replaceWithChildrenElements,
      element,
    );
    if (this.#configuration.elements !== undefined) {
      const index = this.#configuration.elements.findIndex((item) =>
        sameName(item, element),
      );
      if (index < 0) {
        this.#configuration.elements.push(element);
      } else if (
        JSON.stringify(this.#configuration.elements[index]) !==
        JSON.stringify(element)
      ) {
        this.#configuration.elements[index] = element;
      } else {
        return changed;
      }
      return true;
    }
    changed =
      removeName(this.#configuration.removeElements, element) || changed;
    return changed;
  }

  removeElement(value: SanitizerElement): boolean {
    const element = canonicalName(value, HTML_NAMESPACE);
    const changed = removeName(
      this.#configuration.replaceWithChildrenElements,
      element,
    );
    if (this.#configuration.elements !== undefined) {
      return removeName(this.#configuration.elements, element) || changed;
    }
    if (
      (this.#configuration.removeElements ?? []).some((item) =>
        sameName(item, element),
      )
    ) {
      return changed;
    }
    this.#configuration.removeElements?.push(element);
    return true;
  }

  replaceElementWithChildren(value: SanitizerElement): boolean {
    const element = canonicalName(value, HTML_NAMESPACE);
    if (NON_REPLACEABLE_ELEMENTS.some((item) => sameName(item, element))) {
      return false;
    }
    let changed = removeName(this.#configuration.elements, element);
    changed =
      removeName(this.#configuration.removeElements, element) || changed;
    if (
      (this.#configuration.replaceWithChildrenElements ?? []).some((item) =>
        sameName(item, element),
      )
    ) {
      return changed;
    }
    (this.#configuration.replaceWithChildrenElements ??= []).push(element);
    return true;
  }

  allowProcessingInstruction(value: SanitizerPI): boolean {
    return updatePI(this.#configuration, canonicalPI(value), true);
  }
  removeProcessingInstruction(value: SanitizerPI): boolean {
    return updatePI(this.#configuration, canonicalPI(value), false);
  }
  allowAttribute(value: SanitizerAttribute): boolean {
    return updateAttribute(
      this.#configuration,
      canonicalName(value, null),
      true,
    );
  }
  removeAttribute(value: SanitizerAttribute): boolean {
    return updateAttribute(
      this.#configuration,
      canonicalName(value, null),
      false,
    );
  }
  setComments(allow: boolean): boolean {
    const changed = this.#configuration.comments !== allow;
    this.#configuration.comments = allow;
    return changed;
  }
  setDataAttributes(allow: boolean): boolean {
    const next = allow;
    const changed = this.#configuration.dataAttributes !== next;
    this.#configuration.dataAttributes = next;
    return changed;
  }
  setJavascriptURLs(allow: boolean): boolean {
    const next = allow;
    const changed = this.#configuration.javascriptURLs !== next;
    this.#configuration.javascriptURLs = next;
    return changed;
  }
  removeUnsafe(): boolean {
    let changed = false;
    for (const element of SAFE_BASELINE_ELEMENTS) {
      changed = this.removeElement(element) || changed;
    }
    for (const attribute of EVENT_HANDLER_ATTRIBUTES) {
      changed = this.removeAttribute(attribute) || changed;
    }
    changed = this.setJavascriptURLs(false) || changed;
    return changed;
  }
}

function removeName(
  list: CanonicalSanitizerName[] | undefined,
  value: CanonicalSanitizerName,
): boolean {
  if (list === undefined) {
    return false;
  }
  const index = list.findIndex((item) => sameName(item, value));
  if (index < 0) {
    return false;
  }
  list.splice(index, 1);
  return true;
}

function updatePI(
  config: CanonicalSanitizerConfig,
  value: CanonicalSanitizerPI,
  allow: boolean,
): boolean {
  const primary = allow
    ? config.processingInstructions
    : config.removeProcessingInstructions;
  const inverse = allow
    ? config.removeProcessingInstructions
    : config.processingInstructions;
  const changed = removePI(inverse, value);
  if (primary !== undefined) {
    if (primary.some((item) => item.target === value.target)) {
      return changed;
    }
    primary.push(value);
    return true;
  }
  return removePI(inverse, value) || changed;
}

function removePI(
  list: CanonicalSanitizerPI[] | undefined,
  value: CanonicalSanitizerPI,
): boolean {
  if (list === undefined) {
    return false;
  }
  const index = list.findIndex((item) => item.target === value.target);
  if (index < 0) {
    return false;
  }
  list.splice(index, 1);
  return true;
}

function updateAttribute(
  config: CanonicalSanitizerConfig,
  value: CanonicalSanitizerName,
  allow: boolean,
): boolean {
  const primary = allow ? config.attributes : config.removeAttributes;
  const inverse = allow ? config.removeAttributes : config.attributes;
  let changed = removeName(inverse, value);
  for (const element of config.elements ?? []) {
    changed =
      removeName(
        allow ? element.removeAttributes : element.attributes,
        value,
      ) || changed;
  }
  if (primary !== undefined) {
    if (primary.some((item) => sameName(item, value))) {
      return changed;
    }
    primary.push(value);
    return true;
  }
  return removeName(inverse, value) || changed;
}

export type SanitizerAction = "keep" | "remove" | "replace";

export function sanitizerAction(
  config: CanonicalSanitizerConfig,
  localName: string,
  namespace: string | null,
): SanitizerAction {
  const name = { name: localName, namespace };
  if (
    config.replaceWithChildrenElements?.some((item) => sameName(item, name)) ===
    true
  ) {
    return "replace";
  }
  if (config.elements !== undefined) {
    return config.elements.some((item) => sameName(item, name))
      ? "keep"
      : "remove";
  }
  return config.removeElements?.some((item) => sameName(item, name)) === true
    ? "remove"
    : "keep";
}

export function sanitizerAllowsComments(
  config: CanonicalSanitizerConfig,
): boolean {
  return config.comments;
}

export function sanitizerAllowsPI(
  config: CanonicalSanitizerConfig,
  target: string,
): boolean {
  if (config.processingInstructions !== undefined) {
    return config.processingInstructions.some((item) => item.target === target);
  }
  return (
    config.removeProcessingInstructions?.some(
      (item) => item.target === target,
    ) !== true
  );
}

function isDataAttribute(value: CanonicalSanitizerName): boolean {
  return value.namespace === null && value.name.startsWith("data-");
}

function containsJavascriptURL(value: string): boolean {
  const normalized = value
    .replace(/[\t\n\r]/gu, "")
    .trimStart()
    .toLowerCase();
  return normalized.startsWith("javascript:");
}

function isNavigatingURLAttribute(
  elementLocalName: string,
  elementNamespace: string | null,
  attributeLocalName: string,
  attributeNamespace: string | null,
): boolean {
  if (elementNamespace === HTML_NAMESPACE && attributeNamespace === null) {
    return (
      (["a", "area"].includes(elementLocalName) &&
        attributeLocalName === "href") ||
      (["button", "input"].includes(elementLocalName) &&
        attributeLocalName === "formaction") ||
      (elementLocalName === "form" && attributeLocalName === "action")
    );
  }
  if (elementNamespace === SVG_NAMESPACE && elementLocalName === "a") {
    return (
      attributeLocalName === "href" &&
      (attributeNamespace === null || attributeNamespace === XLINK_NAMESPACE)
    );
  }
  return (
    elementNamespace === MATHML_NAMESPACE &&
    attributeLocalName === "href" &&
    (attributeNamespace === null || attributeNamespace === XLINK_NAMESPACE)
  );
}

export function sanitizerAllowsAttribute(
  config: CanonicalSanitizerConfig,
  localName: string,
  namespace: string | null,
  value: string,
  elementLocalName: string,
  elementNamespace: string | null,
): boolean {
  const attribute = { name: localName, namespace };
  const element = config.elements?.find(
    (item) =>
      item.name === elementLocalName && item.namespace === elementNamespace,
  );
  if (
    element?.removeAttributes?.some((item) => sameName(item, attribute)) ===
    true
  ) {
    return false;
  }
  let allowed: boolean;
  if (config.attributes !== undefined) {
    allowed =
      config.attributes.some((item) => sameName(item, attribute)) ||
      element?.attributes?.some((item) => sameName(item, attribute)) === true ||
      (config.dataAttributes === true && isDataAttribute(attribute));
  } else {
    allowed =
      (element?.attributes === undefined ||
        element.attributes.some((item) => sameName(item, attribute))) &&
      config.removeAttributes?.some((item) => sameName(item, attribute)) !==
        true;
  }
  if (!allowed) {
    return false;
  }
  if (config.javascriptURLs) {
    return true;
  }
  if (
    isNavigatingURLAttribute(
      elementLocalName,
      elementNamespace,
      localName,
      namespace,
    ) &&
    containsJavascriptURL(value)
  ) {
    return false;
  }
  if (
    elementNamespace === SVG_NAMESPACE &&
    ["animate", "animateTransform", "set"].includes(elementLocalName) &&
    localName === "attributeName" &&
    (value === "href" || value === "xlink:href")
  ) {
    return false;
  }
  return true;
}

export function sanitizerConfigForParsing(
  input: Sanitizer | SanitizerConfig | "default" | undefined,
  safe: boolean,
): CanonicalSanitizerConfig | null {
  if (!safe && input === undefined) {
    return null;
  }
  let source: SanitizerConfig | CanonicalSanitizerConfig;
  if (input === undefined || input === "default") {
    source = DEFAULT_CONFIG;
  } else if (input instanceof Sanitizer) {
    source = input.configuration();
  } else {
    source = input;
  }
  const sanitizer = Sanitizer.fromConfiguration(source, !safe);
  if (safe) {
    sanitizer.removeUnsafe();
  }
  return sanitizer.configuration();
}
