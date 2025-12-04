import bcrypt from "bcryptjs";
import crypto from "crypto";

async function hash(password: string) {
  password = addPepper(password);
  const rounds = await getNumbersOfRounds();

  return bcrypt.hash(password, rounds);
}

async function compare(providedPassword: string, storedPassword: string) {
  providedPassword = addPepper(providedPassword);

  return bcrypt.compare(providedPassword, storedPassword);
}

const password = {
  hash,
  compare,
};

export default password;

async function getNumbersOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

function addPepper(password: string) {
  const pepper = process.env.BCRYPT_PEPPER;

  return crypto
    .createHash("sha256")
    .update(password + pepper)
    .digest("hex");
}
