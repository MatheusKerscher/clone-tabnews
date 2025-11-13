import nextJest from "next/jest.js";
import type { Config } from "jest";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

const createJestConfig = nextJest({
  dir: ".",
});

const config: Config = {
  watchPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 60000,
};

export default createJestConfig(config);
