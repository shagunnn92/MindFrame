import { neon } from "@neondatabase/serverless";

export class DatabaseConfigurationError extends Error {
  constructor() {
    super("DATABASE_URL is not configured.");
    this.name = "DatabaseConfigurationError";
  }
}

/** Creates the server-only Neon query client. Never import this from a Client Component. */
export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new DatabaseConfigurationError();
  return neon(connectionString);
}
