import { messagesEn } from "./messages.en";

type MessageFn = (...args: readonly unknown[]) => string;

type Join<Prefix extends string, Key extends string> = Prefix extends ""
  ? Key
  : `${Prefix}.${Key}`;

type MessageKeyOf<T> = {
  [K in keyof T & string]: T[K] extends string | MessageFn
    ? K
    : T[K] extends Record<string, unknown>
      ? Join<K, MessageKeyOf<T[K]>>
      : never;
}[keyof T & string];

type KeyMirror<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string | MessageFn
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
      ? KeyMirror<T[K], `${Prefix}${K}.`>
      : never;
};

function normalizeLocale(value: unknown): "en" {
  if (typeof value !== "string") {
    return "en";
  }

  const trimmed = value.trim().toLowerCase();
  if (trimmed === "en" || trimmed.startsWith("en-")) {
    return "en";
  }

  return "en";
}

const selectedLocale = normalizeLocale(
  import.meta.env.VITE_APP_LOCALE ?? import.meta.env.VITE_LOCALE
);

const selectedMessages = selectedLocale === "en" ? messagesEn : messagesEn;

export type MessageKey = MessageKeyOf<typeof selectedMessages>;
export type { MessageFn };

function buildKeyMirror<T extends Record<string, unknown>, Prefix extends string>(
  obj: T,
  prefix: Prefix
): KeyMirror<T, Prefix> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    const value = obj[key as keyof T];
    const fullKey = `${prefix}${key}`;

    if (typeof value === "string" || typeof value === "function") {
      result[key] = fullKey;
      continue;
    }

    if (value && typeof value === "object") {
      result[key] = buildKeyMirror(
        value as Record<string, unknown>,
        `${fullKey}.` as `${Prefix}${string}.`
      );
      continue;
    }

    result[key] = fullKey;
  }

  return result as KeyMirror<T, Prefix>;
}

export const msgKey = buildKeyMirror(messagesEn, "");

function getMessageLeaf(
  messages: Record<string, unknown>,
  key: string
): string | MessageFn | undefined {
  let current: unknown = messages;

  for (const part of key.split(".")) {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    const record = current as Record<string, unknown>;
    current = record[part];
  }

  if (typeof current === "string" || typeof current === "function") {
    return current as string | MessageFn;
  }

  return undefined;
}

export function translate(key: MessageKey, ...args: readonly unknown[]): string {
  const leaf = getMessageLeaf(selectedMessages as unknown as Record<string, unknown>, key);

  if (!leaf) {
    return key;
  }

  if (typeof leaf === "function") {
    return leaf(...args);
  }

  return leaf;
}

export const t = translate;
