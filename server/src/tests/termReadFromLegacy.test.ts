import { describe, it, expect } from "vitest";
import type { Reader } from "../Serializer/Reader";
import { Term } from "../Models/Term";

function makeReader(row: {
  id: number;
  termName: string | null;
  displayName: string | null;
}): Reader {
  return {
    readRoot: async () => {
      throw new Error("not used");
    },
    readObject: async () => null,
    readObjects: async () => [],
    readString: (attributeName: string) => {
      if (attributeName === "termName") return row.termName;
      if (attributeName === "displayName") return row.displayName;
      return null;
    },
    readNumber: (attributeName: string) => {
      if (attributeName === "id") return row.id;
      return null;
    },
    readDateTime: () => null,
  };
}

describe("Term.readFrom legacy handling", () => {
  it("does not throw for legacy non-conforming termName", async () => {
    const term = new Term(0);
    await expect(
      term.readFrom(
        makeReader({ id: 1, termName: "WS2025/24", displayName: "Legacy" })
      )
    ).resolves.toBeUndefined();

    expect(term.getTermName()?.toString()).toBe("WS2025/24");
  });

  it("does not throw for completely invalid termName (sets null)", async () => {
    const term = new Term(0);
    await expect(
      term.readFrom(
        makeReader({ id: 2, termName: "Term To Delete", displayName: null })
      )
    ).resolves.toBeUndefined();

    expect(term.getTermName()).toBeNull();
  });
});
