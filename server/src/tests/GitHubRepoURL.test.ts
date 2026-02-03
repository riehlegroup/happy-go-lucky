import { describe, it, expect } from "vitest";
import { GitHubRepoURL } from "../Models/GitHubRepoURL";

describe("GitHubRepoURL", () => {
  it("should create a new value", () => {
    expect(new GitHubRepoURL("https://github.com/riehlegroup/happy-go-lucky"));
  });

  it("asString() should return the whole URL", () => {
    const url = new GitHubRepoURL("https://github.com:73/riehlegroup/happy-go-lucky.git");
    expect(url.asString()).toBe("https://github.com:73/riehlegroup/happy-go-lucky.git");
  });

  it("should throw if URL isn't a GitHub URL", () => {
    expect(() => new GitHubRepoURL("https://gitlab.com/riehlegroup/happy-go-lucky")).toThrow();
  });

  it("should throw if URL isn't of supported structure", () => {
    expect(() => new GitHubRepoURL("git@github.com:riehlegroup/happy-go-lucky.git")).toThrow();
  });

  it("should throw if URL has unsupported protocoll", () => {
    expect(() => new GitHubRepoURL("ssh://github.com/riehlegroup/happy-go-lucky")).toThrow();
  });

  it("should throw if URL has no repo structure", () => {
    expect(() => new GitHubRepoURL("https://github.com/riehlegroup")).toThrow();
  });
});