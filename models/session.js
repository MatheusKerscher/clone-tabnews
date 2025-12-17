import crypto from "node:crypto";

import database from "infra/database";
import { UnauthorizedError } from "infra/errors";

const EXPIRES_IN_MILLISECONDS = 60 * 60 * 24 * 30 * 1000;

async function findOneValidByToken(sessionToken) {
  const foundSession = await runSelectQuery(sessionToken);
  return foundSession;

  async function runSelectQuery(sessionToken) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM 
          sessions
        WHERE
          expires_at > NOW()
          AND token = $1
        LIMIT
          1
      ;`,
      values: [sessionToken],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
      });
    }

    return results.rows[0];
  }
}

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

async function renew(sessionId) {
  const expiresAt = getExpiresAt();

  const renewedSession = await runUpdateQuery(sessionId, expiresAt);
  return renewedSession;

  async function runUpdateQuery(sessionId, expiresAt) {
    const results = await database.query({
      text: `
        UPDATE
          sessions
        SET
          updated_at = timezone('utc', NOW()),
          expires_at = $2
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId, expiresAt],
    });

    return results.rows[0];
  }
}

async function expireById(sessionId) {
  const renewedSession = await runUpdateQuery(sessionId);
  return renewedSession;

  async function runUpdateQuery(sessionId) {
    const results = await database.query({
      text: `
        UPDATE
          sessions
        SET
          updated_at = timezone('utc', NOW()),
          expires_at = timezone('utc', expires_at - interval '1 year')
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId],
    });

    return results.rows[0];
  }
}

function getExpiresAt() {
  return new Date(Date.now() + EXPIRES_IN_MILLISECONDS);
}

const session = {
  EXPIRES_IN_MILLISECONDS,
  create,
  renew,
  expireById,
  findOneValidByToken,
};

export default session;
