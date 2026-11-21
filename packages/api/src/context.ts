import type { Session } from "@gemini-hack/auth";
import type { Database } from "@gemini-hack/db";

export type Context = {
  session: Session | null;
  db: Database;
};
