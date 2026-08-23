import jwt from "jsonwebtoken";

export function generateTestToken(id: number): string {
    const secretKey = process.env.JWT_SECRET || "your_jwt_secret";
    return jwt.sign({ id: id }, secretKey);
}