import database from "infra/database";
import { ValidationError, NotFoundError } from "infra/errors";
import password from "./password";

type UserProps = {
  username: string;
  email: string;
  password: string;
};

async function findOneByUsername(username: string) {
  const userFound = await runSelectQuery(username);

  return userFound;

  async function runSelectQuery(username: string) {
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

async function create(userInputValues: UserProps) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery({ ...userInputValues });
  return newUser;

  async function runInsertQuery({ username, email, password }: UserProps) {
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

  async function hashPasswordInObject(userInputValues: UserProps) {
    const hashedPassword = await password.hash(userInputValues.password);

    userInputValues.password = hashedPassword;
  }
}

async function validateUniqueEmail(email: string) {
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
      action: "Utilize outro e-mail para realizar o cadastro.",
    });
  }
}

async function validateUniqueUsername(username: string) {
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
      action: "Utilize outro username para realizar o cadastro.",
    });
  }
}

const user = {
  create,
  findOneByUsername,
};

export default user;
