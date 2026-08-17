import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./supabase/drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.POSTGRES_URL || "postgresql://postgres:postgres@localhost:5432/postgres" },
});
