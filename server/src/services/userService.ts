import type { User } from "@prisma/client";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword, type Role } from "../domain/auth.js";

export type UserErrorCode = "EMAIL_TAKEN" | "INVALID_CREDENTIALS";

export class UserError extends Error {
  constructor(public code: UserErrorCode, message: string) {
    super(message);
    this.name = "UserError";
  }
}

export interface PublicUser {
  id: string;
  email: string;
  role: Role;
}

export function publicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, role: user.role as Role };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Create a new user (and their stats row). Throws UserError("EMAIL_TAKEN") on duplicates. */
export async function registerUser(
  email: string,
  password: string,
  role: Role = "learner",
): Promise<User> {
  const normalized = normalizeEmail(email);
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    throw new UserError("EMAIL_TAKEN", "That email is already registered");
  }
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      role,
      stats: { create: {} },
    },
  });
}

/** Verify credentials. Throws UserError("INVALID_CREDENTIALS") on any mismatch. */
export async function authenticateUser(email: string, password: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user) {
    throw new UserError("INVALID_CREDENTIALS", "Invalid email or password");
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw new UserError("INVALID_CREDENTIALS", "Invalid email or password");
  }
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}
