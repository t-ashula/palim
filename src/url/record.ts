export type URLHost =
  | { readonly type: "domain" | "opaque"; readonly value: string }
  | { readonly type: "ipv4"; readonly value: number }
  | { readonly type: "ipv6"; readonly value: readonly number[] };

export interface URLRecord {
  scheme: string;
  username: string;
  password: string;
  host: URLHost | null;
  port: number | null;
  path: string[] | string;
  query: string | null;
  fragment: string | null;
}

const SPECIAL_SCHEMES: Readonly<Record<string, number | null>> = {
  ftp: 21,
  file: null,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
};

export function isSpecialScheme(scheme: string): boolean {
  return Object.hasOwn(SPECIAL_SCHEMES, scheme);
}

export function defaultPort(scheme: string): number | null | undefined {
  return SPECIAL_SCHEMES[scheme];
}

export function hasOpaquePath(url: URLRecord): boolean {
  return typeof url.path === "string";
}

export function cloneURLRecord(url: URLRecord): URLRecord {
  return {
    scheme: url.scheme,
    username: url.username,
    password: url.password,
    host:
      url.host?.type === "ipv6"
        ? { type: "ipv6", value: [...url.host.value] }
        : url.host === null
          ? null
          : { ...url.host },
    port: url.port,
    path: typeof url.path === "string" ? url.path : [...url.path],
    query: url.query,
    fragment: url.fragment,
  };
}

export function emptyURLRecord(): URLRecord {
  return {
    scheme: "",
    username: "",
    password: "",
    host: null,
    port: null,
    path: [],
    query: null,
    fragment: null,
  };
}
