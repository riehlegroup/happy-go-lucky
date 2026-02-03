import { messages as enMessages } from "../Resources/messages.en";

export type Locale = "en";

export type EnvLike = {
  [key: string]: string | undefined;
  APP_LOCALE?: string;
  LOCALE?: string;
};

const catalogs = {
  en: enMessages,
} as const;

type Catalog = typeof catalogs.en;

type LeafMessage = string | ((...args: unknown[]) => string);

/**
 * Compile-time helper type used for `msgKey`.
 *
 * It mirrors the *shape* of the message catalog, but replaces every leaf value
 * (string or function) with a `string` representing the fully qualified dot-path.
 *
 * Why this exists:
 * - Gives autocomplete for available translation keys.
 * - Helps catch typos/renames during refactors.
 *
 * Example:
 * - `msgKey.auth.invalidCredentials` -> "auth.invalidCredentials"
 */
export type MessageKeyMirror<T> = {
  [K in keyof T & string]: T[K] extends string
    ? string
    : T[K] extends (...args: any[]) => any
      ? string
      : T[K] extends object
        ? MessageKeyMirror<T[K]>
        : string;
};

/**
 * Builds the runtime `msgKey` object.
 *
 * It walks the catalog recursively and turns each leaf into its dot-path.
 *
 * Example input:
 * - `{ auth: { invalid: "…" } }`
 * Example output:
 * - `{ auth: { invalid: "auth.invalid" } }`
 */
function createMessageKeyMirror<T extends object>(obj: T, prefix = ""): MessageKeyMirror<T> {
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

/**
 * Normalizes anything (env var, user input, etc.) into a supported `Locale`.
 *
 * Note: currently only "en" exists; other values fall back to "en".
 */
function parseLocale(value: unknown): Locale {
  if (typeof value !== "string") return "en";
  const lower = value.trim().toLowerCase();
  // Accept common Accept-Language variants like:
  // - "en"
  // - "en-US"
  // - "en, de;q=0.9"
  // - "en-US,en;q=0.9"
  if (
    lower === "en" ||
    lower.startsWith("en-") ||
    lower.startsWith("en,") ||
    lower.startsWith("en;")
  )
    return "en";
  return "en";
}

/**
 * Reads `obj["a"]["b"]["c"]` given a dot-path like "a.b.c".
 *
 * Used to look up messages by the key strings produced by `msgKey`.
 */
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

/**
 * i18n service abstraction.
 *
 * This follows the same design pattern as other services in this codebase
 * (e.g. `IEmailService` + `ConsoleEmailService`): controllers/middleware
 * depend on the interface, and a concrete implementation is injected.
 */
export interface II18nService {
  readonly locale: Locale;
  translate(key: string, ...args: unknown[]): string;
  translate(req: unknown, key: string, ...args: unknown[]): string;
}

export class I18nService implements II18nService {
  public readonly locale: Locale;
  public readonly catalog: Catalog;

  public constructor(locale: unknown) {
    this.locale = parseLocale(locale);
    this.catalog = catalogs[this.locale];
  }

  /**
   * Shared implementation for both call styles:
   * - `translate(key, ...args)`
   * - `translate(req, key, ...args)`
   *
   * The `req` parameter is accepted for ergonomic use in Express handlers
   * where you may already have `req` available.
   *
   * If a request is provided, we try to read locale from it (e.g. from
   * `req.locale`, `req.headers["x-locale"]`, or `req.headers["accept-language"]`).
   * If nothing is found, we fall back to the instance locale.
   */
  private doTranslate(reqOrKey: unknown, keyOrArg: unknown | undefined, rest: unknown[]): string {
    const hasReq = typeof reqOrKey !== "string";
    const key = hasReq ? (typeof keyOrArg === "string" ? keyOrArg : "") : reqOrKey;
    const messageArgs = hasReq
      ? rest
      : keyOrArg === undefined
        ? []
        : [keyOrArg, ...rest];

    // Optional per-request locale.
    // This keeps existing call sites (`translate(req, key)`) meaningful.
    const reqObj = hasReq && reqOrKey && typeof reqOrKey === "object" ? (reqOrKey as Record<string, unknown>) : undefined;
    const headers = reqObj && reqObj.headers && typeof reqObj.headers === "object" ? (reqObj.headers as Record<string, unknown>) : undefined;
    const requestLocaleRaw = reqObj?.locale ?? headers?.["x-locale"] ?? headers?.["accept-language"];
    const locale = hasReq ? parseLocale(requestLocaleRaw) : this.locale;
    const catalog = catalogs[locale];

    const value = getValueByPath(catalog, key) as LeafMessage | undefined;

    if (typeof value === "function") {
      return value(...messageArgs);
    }

    if (typeof value === "string") {
      return value;
    }

    return key;
  }

  /**
   * Translates a message key into a string.
   *
   * Usage examples:
   * - `translate(msgKey.auth.invalidCredentials)`
   * - `translate(msgKey.mail.resetPassword, resetLink)`
   * - `translate(req, msgKey.errors.unauthorized)`
   */
  public translate(key: string, ...args: unknown[]): string;
  public translate(req: unknown, key: string, ...args: unknown[]): string;
  public translate(reqOrKey: unknown, keyOrArg?: unknown, ...rest: unknown[]): string {
    return this.doTranslate(reqOrKey, keyOrArg, rest);
  }

  public static fromEnv(env: EnvLike = process.env as EnvLike): I18nService {
    return new I18nService(env.APP_LOCALE ?? env.LOCALE);
  }
}

export function createI18n(locale: unknown): II18nService {
  return new I18nService(locale);
}

export function createI18nFromEnv(env: EnvLike = process.env as EnvLike): II18nService {
  return I18nService.fromEnv(env);
}
