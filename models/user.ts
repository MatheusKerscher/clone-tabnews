import database from "infra/database";
import { ValidationError } from "infra/errors";

type UserProps = {
  username: string;
  email: string;
  password: string;
};

async function create({ username, email, password }: UserProps) {
  await validateUniqueUsername(username);
  await validateUniqueEmail(email);
  const newUser = await runInsertQuery({ username, email, password });
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
};

export default user;
