export enum PasswordStrength {
  VERY_WEAK = 1,
  WEAK = 2,
  MEDIUM = 3,
  STRONG = 4,
  VERY_STRONG = 5,
}

export class Password {
  private constructor(
    private readonly passwordValue: string,
    private readonly strength: PasswordStrength
  ) {}

  public static create(passwordValue: string): Password {
    if (!passwordValue || passwordValue === undefined) {
      passwordValue = "";
    }
    return new Password(
      passwordValue,
      Password.calculatePasswordStrength(passwordValue)
    );
  }

  public getValue(): string {
    return this.passwordValue;
  }

  public getStrength(): PasswordStrength {
    return this.strength;
  }

  public toString(): string {
    return this.passwordValue;
  }

  private static calculatePasswordStrength(value: string): PasswordStrength {
    // password needs to be at least 8 characters long
    if (value.length < 8) {
      return PasswordStrength.VERY_WEAK;
    }

    // mixed case, special characters, numbers and length > 12 contribute to password strength
    let baseValue = 1;
    if (Password.containsLowerAndUpperCase(value)) {
      baseValue++;
    }
    if (Password.containsNumber(value)) {
      baseValue++;
    }
    if (Password.containsSpecialCharacter(value)) {
      baseValue++;
    }
    if (value.length >= 12) {
      baseValue++;
    }

    return baseValue as PasswordStrength;
  }

  private static containsLowerAndUpperCase(value: string): boolean {
    return value !== value.toLowerCase() && value !== value.toUpperCase();
  }

  private static containsNumber(value: string): boolean {
    return /\d/.test(value);
  }

  private static containsSpecialCharacter(value: string): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>~\/?]+/.test(value);
  }
}
