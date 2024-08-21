import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const connectionSchema = `${process.env.DATABASE_SCHEMA}`;

const pool = new pg.Pool({
  connectionString,
});

const adapter = new PrismaPg(pool, {
  schema: connectionSchema,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
