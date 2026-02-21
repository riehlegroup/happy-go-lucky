import { User } from "@/types/models";

/**
 * Centralized authentication storage service.
 * Manages token and user data in localStorage.
 */
class AuthStorage {
  private static instance: AuthStorage;
  private readonly TOKEN_KEY = "token";
  private readonly EMAIL_KEY = "email";
  private readonly USER_NAME_KEY = "username";
  private readonly USER_ROLE_KEY = "userRole";
  private readonly GITHUB_USERNAME_KEY = "githubUsername";

  private constructor() {}

  static getInstance(): AuthStorage {
    if (!AuthStorage.instance) {
      AuthStorage.instance = new AuthStorage();
    }
    return AuthStorage.instance;
  }

  // Token management
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // User data management
  getUser(): Partial<User> | null {
    const email = localStorage.getItem(this.EMAIL_KEY);
    const userName = localStorage.getItem(this.USER_NAME_KEY);
    const userRole = localStorage.getItem(this.USER_ROLE_KEY);
    const githubUsername = localStorage.getItem(this.GITHUB_USERNAME_KEY);

    if (!email) {
      return null;
    }

    return {
      email,
      name: userName || undefined,
      userRole: userRole || undefined,
      githubUsername: githubUsername || undefined,
    };
  }

  setUser(user: Partial<User>): void {
    if (user.email) {
      localStorage.setItem(this.EMAIL_KEY, user.email);
    }
    if (user.name) {
      localStorage.setItem(this.USER_NAME_KEY, user.name);
    }
    if (user.userRole) {
      localStorage.setItem(this.USER_ROLE_KEY, user.userRole);
    }
    if (user.githubUsername) {
      localStorage.setItem(this.GITHUB_USERNAME_KEY, user.githubUsername);
    }
  }

  getEmail(): string | null {
    return localStorage.getItem(this.EMAIL_KEY);
  }

  setEmail(email: string): void {
    localStorage.setItem(this.EMAIL_KEY, email);
  }

  getUserName(): string | null {
    return localStorage.getItem(this.USER_NAME_KEY);
  }

  setUserName(name: string): void {
    localStorage.setItem(this.USER_NAME_KEY, name);
  }

  getUserRole(): string | null {
    return localStorage.getItem(this.USER_ROLE_KEY);
  }

  setUserRole(role: string): void {
    localStorage.setItem(this.USER_ROLE_KEY, role);
  }

  getGitHubUsername(): string | null {
    return localStorage.getItem(this.GITHUB_USERNAME_KEY);
  }

  setGitHubUsername(username: string): void {
    localStorage.setItem(this.GITHUB_USERNAME_KEY, username);
  }

  // Authentication state
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  // Clear all auth data
  clear(): void {
    this.removeToken();
    localStorage.removeItem(this.EMAIL_KEY);
    localStorage.removeItem(this.USER_NAME_KEY);
    localStorage.removeItem(this.USER_ROLE_KEY);
    localStorage.removeItem(this.GITHUB_USERNAME_KEY);
  }
}

export default AuthStorage;
