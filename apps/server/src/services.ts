import { createAuth } from "@gemini-hack/auth";
import { createDb } from "@gemini-hack/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
