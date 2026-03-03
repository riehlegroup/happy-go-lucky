import { describe, it, expect } from "vitest";
import { parseTermName } from "@/valueTypes/TermName";

describe("parseTermName", () => {
  it("accepts WS/SS short forms", () => {
    expect(parseTermName("WS24")).toEqual({ ok: true, value: "WS2024" });
    expect(parseTermName("ss25")).toEqual({ ok: true, value: "SS2025" });

    // For years >= 2100, the 4-digit year must be provided.
    expect(parseTermName("WS2100")).toEqual({ ok: true, value: "WS2100" });
  });

  it("accepts long season names", () => {
    expect(parseTermName("Winter 2024")).toEqual({ ok: true, value: "WS2024" });
    expect(parseTermName("Summer2025")).toEqual({ ok: true, value: "SS2025" });
  });

  it("accepts logical year ranges", () => {
    expect(parseTermName("WS24/25")).toEqual({ ok: true, value: "WS2024/25" });
    expect(parseTermName("Winter 2024/2025")).toEqual({
      ok: true,
      value: "WS2024/25",
    });
    expect(parseTermName("SS2025/26")).toEqual({ ok: true, value: "SS2025/26" });

    // Whitespace and slash spacing should not matter.
    expect(parseTermName("  ws  2024 / 25  ")).toEqual({
      ok: true,
      value: "WS2024/25",
    });

    // Century rollover: 2099 -> 2100
    expect(parseTermName("WS2099/2100")).toEqual({
      ok: true,
      value: "WS2099/00",
    });
  });

  it("rejects illogical year ranges", () => {
    expect(parseTermName("WS2025/24").ok).toBe(false);
    expect(parseTermName("WS24/24").ok).toBe(false);
    expect(parseTermName("SS2025/24").ok).toBe(false);

    // Should be 2099/00, not 2099/01
    expect(parseTermName("WS2099/01").ok).toBe(false);
  });

  it("rejects invalid values", () => {
    expect(parseTermName("").ok).toBe(false);
    expect(parseTermName("Term To Delete").ok).toBe(false);
    expect(parseTermName("2024WS").ok).toBe(false);
    expect(parseTermName("WS2").ok).toBe(false);
  });
});
