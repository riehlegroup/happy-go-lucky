export interface DatabaseUser {
  id: number;
  name: string;
  email: string;
  userRole: "ADMIN" | "USER";
}