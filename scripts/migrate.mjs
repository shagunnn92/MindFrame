import { readFile } from "node:fs/promises";
import { join } from "node:path";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing. Add your Neon connection string to .env.local first.");
  process.exitCode = 1;
} else {
  const sql = neon(connectionString);
  const migrationName = "001_create_assessment_results";
  const migrationPath = join(process.cwd(), "db", "migrations", `${migrationName}.sql`);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    const [applied] = await sql`
      SELECT version FROM schema_migrations WHERE version = ${migrationName}
    `;

    if (applied) {
      console.log(`Migration ${migrationName} is already applied.`);
    } else {
      const migration = await readFile(migrationPath, "utf8");
      const statements = migration
        .split(";")
        .map((statement) => statement.trim())
        .filter(Boolean);
      const queries = statements.map((statement) => sql.query(statement, []));
      queries.push(sql`INSERT INTO schema_migrations (version) VALUES (${migrationName})`);
      await sql.transaction(queries);
      console.log(`Applied migration ${migrationName}.`);
    }
  } catch (error) {
    console.error("Database migration failed. Check DATABASE_URL and the Neon database logs.");
    console.error(error instanceof Error ? error.message : "Unknown migration error.");
    process.exitCode = 1;
  }
}
