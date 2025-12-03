import bcrypt from "bcryptjs";

async function hash(valueToHash: string) {
  const rounds = await getNumbersOfRounds();
  return bcrypt.hash(valueToHash, rounds);
}

async function compare(providedPassword: string, storedPassword: string) {
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
