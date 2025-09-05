import { PrismaClient } from "@prisma/client";

declare global {
  // attach to global to avoid multiple clients in dev
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __prisma: PrismaClient | undefined;
}

const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

export default prisma;

export {};
