import crypto from "node:crypto";
import * as cookie from "cookie";

import database from "infra/database";

const EXPIRES_IN_MILLISECONDS = 60 * 60 * 24 * 30 * 1000;

async function create(userId) {
  //Why 48 bytes? 1 byte = 2 characters in hex, 48 bytes = 96 characters (size of field token in database)
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRES_IN_MILLISECONDS);

  const createdSession = await runInsertQuery(userId, token, expiresAt);
  return createdSession;

  async function runInsertQuery(userId, token, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          sessions (user_id, token, expires_at)
        VALUES 
          ($1, $2, $3)
        RETURNING
          *
      ;`,
      values: [userId, token, expiresAt],
    });

    return results.rows[0];
  }
}

function createCookie(sessionToken) {
  return cookie.serialize("session_id", sessionToken, {
    path: "/",
    httpOnly: true,
    maxAge: EXPIRES_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
  });
}

const session = {
  EXPIRES_IN_MILLISECONDS,
  create,
  createCookie,
};

export default session;
