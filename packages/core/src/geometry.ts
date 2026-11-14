export interface DOMRectInit {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
}

function rectValue(value: unknown): number {
  return value === undefined ? 0 : Number(value);
}

function unrestrictedDouble(value: unknown): number {
  return Number(value);
}

function unsignedLong(value: unknown): number {
  return Math.trunc(Number(value)) >>> 0;
}

function rectInit(other: DOMRectInit): [number, number, number, number] {
  return [
    rectValue(other.x),
    rectValue(other.y),
    rectValue(other.width),
    rectValue(other.height),
  ];
}

export class DOMRectReadOnly {
  readonly #x: number;
  readonly #y: number;
  readonly #width: number;
  readonly #height: number;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.#x = unrestrictedDouble(x);
    this.#y = unrestrictedDouble(y);
    this.#width = unrestrictedDouble(width);
    this.#height = unrestrictedDouble(height);
    bindDOMInterface(this, this);
  }

  static fromRect(other: DOMRectInit = {}): DOMRectReadOnly {
    return new DOMRectReadOnly(...rectInit(other));
  }

  get x(): number {
    return this.#x;
  }

  get y(): number {
    return this.#y;
  }

  get width(): number {
    return this.#width;
  }

  get height(): number {
    return this.#height;
  }

  get top(): number {
    return Math.min(this.y, this.y + this.height);
  }

  get right(): number {
    return Math.max(this.x, this.x + this.width);
  }

  get bottom(): number {
    return Math.max(this.y, this.y + this.height);
  }

  get left(): number {
    return Math.min(this.x, this.x + this.width);
  }

  toJSON(): Record<string, number> {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      top: this.top,
      right: this.right,
      bottom: this.bottom,
      left: this.left,
    };
  }
}

export class DOMRect extends DOMRectReadOnly {
  #x: number;
  #y: number;
  #width: number;
  #height: number;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    const normalizedX = unrestrictedDouble(x);
    const normalizedY = unrestrictedDouble(y);
    const normalizedWidth = unrestrictedDouble(width);
    const normalizedHeight = unrestrictedDouble(height);
    super(normalizedX, normalizedY, normalizedWidth, normalizedHeight);
    this.#x = normalizedX;
    this.#y = normalizedY;
    this.#width = normalizedWidth;
    this.#height = normalizedHeight;
    bindDOMInterface(this, this);
  }

  static override fromRect(other: DOMRectInit = {}): DOMRect {
    return new DOMRect(...rectInit(other));
  }

  override get x(): number {
    return this.#x;
  }

  set x(value: number) {
    this.#x = unrestrictedDouble(value);
  }

  override get y(): number {
    return this.#y;
  }

  set y(value: number) {
    this.#y = unrestrictedDouble(value);
  }

  override get width(): number {
    return this.#width;
  }

  set width(value: number) {
    this.#width = unrestrictedDouble(value);
  }

  override get height(): number {
    return this.#height;
  }

  set height(value: number) {
    this.#height = unrestrictedDouble(value);
  }
}

const DOM_RECT_LIST_CONSTRUCTION = Symbol("DOMRectList construction");

export class DOMRectList implements Iterable<DOMRect> {
  readonly [index: number]: DOMRect | undefined;
  readonly #rects: readonly DOMRect[];

  constructor(
    construction?: typeof DOM_RECT_LIST_CONSTRUCTION,
    rects: readonly DOMRect[] = [],
  ) {
    if (construction !== DOM_RECT_LIST_CONSTRUCTION) {
      throw new TypeError("Illegal constructor");
    }
    this.#rects = [...rects];
    bindDOMInterface(this, this);
    for (const [index, rect] of this.#rects.entries()) {
      Object.defineProperty(this, index, {
        configurable: true,
        enumerable: true,
        value: rect,
      });
    }
  }

  get length(): number {
    return this.#rects.length;
  }

  item(index: number): DOMRect | null {
    return this.#rects[unsignedLong(index)] ?? null;
  }

  [Symbol.iterator](): Iterator<DOMRect> {
    return this.#rects[Symbol.iterator]();
  }
}

export function createDOMRectList(rects: readonly DOMRect[]): DOMRectList {
  return new DOMRectList(DOM_RECT_LIST_CONSTRUCTION, rects);
}
import { bindDOMInterface } from "./dom/binding.js";
