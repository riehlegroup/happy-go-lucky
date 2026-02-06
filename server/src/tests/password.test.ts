import { describe, it, expect } from "vitest";
import { Password, PasswordStrength } from "../Models/Password";

describe("Password", () => {
  it("should create a new password object", () => {
    const password = Password.create("TestPassword123");
    expect(password.getValue()).toBe("TestPassword123");
  });

  it("should create an empty password with no input", () => {
    const password = Password.create("");
    expect(password.getValue()).toBe("");
  });

  it("toString should return the password as a string", () => {
    const password = Password.create("TestPassword123");
    expect(password.toString()).toBe("TestPassword123");
  });
});

describe("Password Strength", () => {
  it("should return a password strength of VeryWeak for a password with less than 8 characters", () => {
    const password = Password.create("Test123");
    expect(password.getStrength()).toBe(PasswordStrength.VERY_WEAK);
  });

  it("should return a password strength of very Weak for a bad password with 8 characters with only lower/upper case", () => {
    const password = Password.create("abcdefgh");
    expect(password.getStrength()).toBe(PasswordStrength.VERY_WEAK);
  });

  it("should return a password strength of Weak for a password with 8 characters and mixed lower and upper case", () => {
    const password = Password.create("ABCDefgh");
    expect(password.getStrength()).toBe(PasswordStrength.WEAK);
  });

  it("should return a password strength of Medium for a password with 8 characters and mixed cases and a number ", () => {
    const password = Password.create("Test1234");
    expect(password.getStrength()).toBe(PasswordStrength.MEDIUM);
  });

  it("should return a password strength of Strong for a password with 8 characters and mixed cases and a number and a special character", () => {
    const password = Password.create("Test1234!");
    expect(password.getStrength()).toBe(PasswordStrength.STRONG);
  });

  it("should also return a password strength of Strong for a password with 12 characters and mixed cases and a special character", () => {
    const password = Password.create("TestTest!?!?");
    expect(password.getStrength()).toBe(PasswordStrength.STRONG);
  });

  it("should return a password strength of very Strong for a password with 12 characters, mixed cases, a number and a special character", () => {
    const password = Password.create("Test1234!Test");
    expect(password.getStrength()).toBe(PasswordStrength.VERY_STRONG);
  });
});
