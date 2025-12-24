import database from "infra/database"
import email from "infra/email"
import { NotFoundError } from "infra/errors"
import webserver from "infra/webserver"
import user from "./user"

const EXPIRES_IN_MILLISECONDS = 60 * 15 * 1000 // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRES_IN_MILLISECONDS)

  const createdToken = await runInsertQuery(userId, expiresAt)
  return createdToken

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt]
    })

    return results.rows[0]
  }
}

async function findOneValidById(tokenId) {
  const activationTokenObject = await runSelectQuery(tokenId);
  return activationTokenObject;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM 
          user_activation_tokens
        WHERE
          expires_at > NOW()
          AND used_at IS NULL
          AND id = $1
        LIMIT
          1
      ;`,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "'Clone TabNews' <contato@kerscher.dev.br>",
    to: user.email,
    subject: "Ative seu cadastro no Clone do TabNews!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no Clone do TabNews:
    
${webserver.origin}/cadastro/ativar${activationToken.id}
    
Atenciosamente,
Equipe Clone TabNews`
  })
}

async function markTokenAsUsed(validActivationToken) {
  const usedActivationToken = await runUpdateQuery(validActivationToken.id);
  return usedActivationToken;

  async function runUpdateQuery(tokenId) {
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          updated_at = timezone('utc', NOW()),
          used_at = timezone('utc', NOW())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [tokenId],
    });

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const activatedUser = await user.setFeatures(userId, ["create:session", "read:session"])
  return activatedUser
}

const activation = {
  create,
  findOneValidById,
  sendEmailToUser,
  markTokenAsUsed,
  activateUserByUserId
}

export default activation