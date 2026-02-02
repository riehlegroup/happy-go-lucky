import { messages as enMessages } from "./messages.en";

export type Locale = "en";

const catalogs = {
  en: enMessages,
} as const;

type Catalog = typeof catalogs.en;

type DotPath<P extends string, K extends string> = P extends "" ? K : `${P}.${K}`;

type Join<K extends string, P extends string> = P extends "" ? K : `${K}.${P}`;

type LeafPaths<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends string
        ? K
        : T[K] extends (...args: infer _A) => string
          ? K
          : T[K] extends object
            ? Join<K, LeafPaths<T[K]>>
            : never;
    }[keyof T & string]
  : never;

type LeafMessage = string | ((...args: unknown[]) => string);

export type MessageKey = LeafPaths<Catalog>;

type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

type MessageArgs<K extends MessageKey> = PathValue<Catalog, K> extends (
  ...args: infer A
) => string
  ? A
  : [];

type MessageKeyMirror<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends string
        ? DotPath<Prefix, K>
        : T[K] extends (...args: infer _A) => string
          ? DotPath<Prefix, K>
          : T[K] extends object
            ? MessageKeyMirror<T[K], DotPath<Prefix, K>>
            : never;
    }
  : never;

function createMessageKeyMirror<T extends object>(
  obj: T,
  prefix = ""
): MessageKeyMirror<T> {
  const out: Record<string, unknown> = {};

  for (const [rawKey, rawValue] of Object.entries(obj as Record<string, unknown>)) {
    const nextPrefix = prefix ? `${prefix}.${rawKey}` : rawKey;

    if (typeof rawValue === "string" || typeof rawValue === "function") {
      out[rawKey] = nextPrefix;
      continue;
    }

    if (rawValue && typeof rawValue === "object") {
      out[rawKey] = createMessageKeyMirror(rawValue as object, nextPrefix);
      continue;
    }

    out[rawKey] = nextPrefix;
  }

  return out as MessageKeyMirror<T>;
}

export const msgKey: MessageKeyMirror<Catalog> = createMessageKeyMirror(enMessages);

function parseStartupLocale(value: unknown): Locale {
  if (typeof value !== "string") return "en";
  const lower = value.trim().toLowerCase();
  if (lower === "en" || lower.startsWith("en-")) return "en";
  return "en";
}

const startupLocale: Locale = parseStartupLocale(process.env.APP_LOCALE ?? process.env.LOCALE);
const startupCatalog: Catalog = catalogs[startupLocale];

function getValueByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function translate<K extends MessageKey>(
  key: K,
  ...args: MessageArgs<K>
): string;
export function translate<K extends MessageKey>(
  req: unknown,
  key: K,
  ...args: MessageArgs<K>
): string;
export function translate<K extends MessageKey>(
  reqOrKey: unknown,
  keyOrArg?: K,
  ...rest: unknown[]
): string {
  const hasReq = typeof reqOrKey !== "string";
  const key = (hasReq ? keyOrArg : reqOrKey) as string;

  const catalog = startupCatalog;
  const value = getValueByPath(catalog, key) as LeafMessage | undefined;

  if (typeof value === "function") {
    return value(...rest);
  }
  if (typeof value === "string") {
    return value;
  }

  return key;
}

export const t = translate;
