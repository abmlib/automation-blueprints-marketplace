import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  rootDir: ".",
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  testMatch: ["**/__tests__/**/*.spec.ts"],
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: "../../coverage/adapters",
};

export default config;
