import { describe, expect, it } from "vitest";

import { I18nService, createI18nFromEnv, msgKey } from "../Services/I18nService";

describe("I18nService", () => {
  it("exposes msgKey paths for autocomplete-safe keys", () => {
    expect(msgKey.common.authenticationRequired).toBe("common.authenticationRequired");
    expect(msgKey.auth.passwordResetSubject).toBe("auth.passwordResetSubject");
    expect(msgKey.user.allConfirmedUsersUpdatedTo).toBe("user.allConfirmedUsersUpdatedTo");
  });

  it("translates static English strings", () => {
    const i18n = new I18nService("en");
    expect(i18n.translate(msgKey.common.invalidToken)).toBe("Invalid token");
    expect(i18n.translate(msgKey.course.courseCreatedSuccessfully)).toBe(
      "Course created successfully"
    );
  });

  it("supports the optional req argument (no runtime switching)", () => {
    const i18n = new I18nService("en");
    expect(i18n.translate({}, msgKey.common.invalidToken)).toBe("Invalid token");
  });

  it("translates messages with interpolation functions", () => {
    const i18n = new I18nService("en");

    expect(i18n.translate(msgKey.user.allConfirmedUsersUpdatedTo, "SUSPENDED")).toBe(
      "All confirmed users have been updated to SUSPENDED"
    );

    expect(i18n.translate(msgKey.auth.passwordResetBody, "https://example.com/reset")).toBe(
      "You requested a password reset. Click the link to reset your password: https://example.com/reset"
    );
  });

  it("selects locale from env when constructed via factory", () => {
    const i18n1 = createI18nFromEnv({ APP_LOCALE: "en-US" });
    expect(i18n1.translate(msgKey.common.authenticationRequired)).toBe(
      "Authentication required"
    );

    const i18n2 = createI18nFromEnv({ APP_LOCALE: "de-DE" });
    // Only the en catalog exists today; non-en values should fall back to en.
    expect(i18n2.translate(msgKey.common.authenticationRequired)).toBe(
      "Authentication required"
    );

    const i18n3 = createI18nFromEnv({ LOCALE: "en" });
    expect(i18n3.translate(msgKey.common.authenticationRequired)).toBe(
      "Authentication required"
    );
  });
});
