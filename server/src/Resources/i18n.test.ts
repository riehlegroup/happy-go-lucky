import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function importFreshI18n(env: Partial<NodeJS.ProcessEnv> = {}) {
  vi.resetModules();

  // Reset env back to original, then apply per-test overrides
  process.env = { ...ORIGINAL_ENV, ...env };

  return await import("./i18n");
}

afterEach(() => {
  // Restore full original env to avoid cross-test leakage
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("i18n resource loading", () => {
  it("exposes msgKey paths for autocomplete-safe keys", async () => {
    const { msgKey } = await importFreshI18n();
    expect(msgKey.common.authenticationRequired).toBe("common.authenticationRequired");
    expect(msgKey.auth.passwordResetSubject).toBe("auth.passwordResetSubject");
    expect(msgKey.user.allConfirmedUsersUpdatedTo).toBe("user.allConfirmedUsersUpdatedTo");
  });

  it("translates static English strings", async () => {
    const { msgKey, translate } = await importFreshI18n();
    expect(translate(msgKey.common.invalidToken)).toBe("Invalid token");
    expect(translate(msgKey.course.courseCreatedSuccessfully)).toBe("Course created successfully");
  });

  it("supports the optional req argument (no runtime switching)", async () => {
    const { msgKey, translate } = await importFreshI18n();
    expect(translate({}, msgKey.common.invalidToken)).toBe("Invalid token");
  });

  it("translates messages with interpolation functions", async () => {
    const { msgKey, translate } = await importFreshI18n();

    expect(translate(msgKey.user.allConfirmedUsersUpdatedTo, "SUSPENDED")).toBe(
      "All confirmed users have been updated to SUSPENDED"
    );

    expect(translate(msgKey.auth.passwordResetBody, "https://example.com/reset")).toBe(
      "You requested a password reset. Click the link to reset your password: https://example.com/reset"
    );
  });

  it("selects locale at module load time using APP_LOCALE/LOCALE", async () => {
    const { msgKey: msgKey1, translate: translate1 } = await importFreshI18n({ APP_LOCALE: "en-US" });
    expect(translate1(msgKey1.common.authenticationRequired)).toBe("Authentication required");

    const { msgKey: msgKey2, translate: translate2 } = await importFreshI18n({ APP_LOCALE: "de-DE" });
    // Only the en catalog exists today; non-en values should fall back to en.
    expect(translate2(msgKey2.common.authenticationRequired)).toBe("Authentication required");

    const { msgKey: msgKey3, translate: translate3 } = await importFreshI18n({ APP_LOCALE: undefined, LOCALE: "en" });
    expect(translate3(msgKey3.common.authenticationRequired)).toBe("Authentication required");
  });
});
