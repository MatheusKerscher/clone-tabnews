import nextJest from "next/jest.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

const createJestConfig = nextJest({
  dir: ".",
});

const config = {
  watchPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 60000,
};

export default createJestConfig(config);
