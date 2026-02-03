import { describe, expect, it } from "vitest";
import { msgKey, translate } from "@/Resources/i18n";

describe("client i18n", () => {
  it("provides msgKey leaves as dotted keys", () => {
    expect(msgKey.auth.tabs.login).toBe("auth.tabs.login");
    expect(msgKey.common.errors.unexpected).toBe("common.errors.unexpected");
  });

  it("translates simple keys", () => {
    expect(translate(msgKey.common.appName)).toBe("Happy Go Lucky");
    expect(translate(msgKey.auth.actions.signIn)).toBe("Sign In");
  });
});
