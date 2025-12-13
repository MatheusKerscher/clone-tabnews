import database from "infra/database";
import { ValidationError, NotFoundError } from "infra/errors";
import password from "./password";

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);

  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM 
          users
        WHERE
          LOWER(username) = LOWER($1)
        LIMIT
          1
        ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "o username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);

  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM 
          users
        WHERE
          LOWER(email) = LOWER($1)
        LIMIT
          1
        ;`,
      values: [email],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "o email informado não foi encontrado no sistema.",
        action: "Verifique se o email está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function create(userInputValues) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery({ ...userInputValues });
  return newUser;

  async function runInsertQuery({ username, email, password }) {
    const results = await database.query({
      text: `
        INSERT INTO 
          users (username, email, password) 
        VALUES
          ($1, $2, $3)
        RETURNING
          *
        ;`,
      values: [username, email, password],
    });

    return results.rows[0];
  }
}

async function update(username, userInputValues) {
  const userFound = await findOneByUsername(username);

  if (userInputValues.username) {
    if (
      userInputValues.username?.toLowerCase() !==
      userFound.username.toLowerCase()
    ) {
      await validateUniqueUsername(userInputValues.username);
    }
  }

  if (userInputValues.email) {
    await validateUniqueEmail(userInputValues.email);
  }

  if (userInputValues.password) {
    await hashPasswordInObject(userInputValues);
  }

  const newUserProps = { ...userFound, ...userInputValues };
  const updatedUser = await runUpdateQuery(newUserProps);

  return updatedUser;

  async function runUpdateQuery(userInputValues) {
    const results = await database.query({
      text: `
        UPDATE 
          users 
        SET
          username = $2,
          email = $3,
          password = $4,
          updated_at = timezone('utc', NOW())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [
        userInputValues.id,
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });

    return results.rows[0];
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
      SELECT 
        username
      FROM 
        users
      WHERE
        LOWER(username) = LOWER($1)
      ;`,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O username informado já está sendo utilizado.",
      action: "Utilize outro username para realizar esta operação.",
    });
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
      SELECT 
        email
      FROM 
        users
      WHERE
        LOWER(email) = LOWER($1)
      ;`,
    values: [email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O e-mail informado já está sendo utilizado.",
      action: "Utilize outro e-mail para realizar esta operação.",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);

  userInputValues.password = hashedPassword;
}

const user = {
  findOneByUsername,
  findOneByEmail,
  create,
  update,
};

export default user;
