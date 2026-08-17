import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function getDb() {
  if (database) return database;
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error("POSTGRES_URL is not configured");
  database = drizzle(
    postgres(url, {
      prepare: false,
      max: 1,
      ssl: "require",
      connect_timeout: 10,
      idle_timeout: 20,
    }),
    { schema },
  );
  return database;
}
