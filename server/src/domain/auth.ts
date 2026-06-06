import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

export type Role = "learner" | "admin";

export interface TokenPayload {
  userId: string;
  role: Role;
}

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

const SALT_ROUNDS = 10;
const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(
  payload: TokenPayload,
  secret: string,
  expiresInSeconds: number = DEFAULT_EXPIRY_SECONDS,
): string {
  return jwt.sign(payload, secret, { expiresIn: expiresInSeconds });
}

export function verifyToken(token: string, secret: string): TokenPayload {
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
  return { userId: String(decoded.userId), role: decoded.role as Role };
}
