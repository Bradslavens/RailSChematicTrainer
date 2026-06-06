import { PrismaClient } from "@prisma/client";

/** Shared Prisma client. Reads DATABASE_URL from the environment. */
export const prisma = new PrismaClient();
