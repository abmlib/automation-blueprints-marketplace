import * as config from "../config";

jest.mock("../config", () => ({
  readConfig: jest.fn().mockReturnValue({}),
  writeConfig: jest.fn(),
}));

import { Command } from "commander";
import { registerLogin } from "./login";

describe("abmlib login", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerLogin(program);
    jest.clearAllMocks();
  });

  it("stores a valid api-key_ token in config", async () => {
    const token = "api-key_" + "a".repeat(64);
    await program.parseAsync(["node", "abmlib", "login", token]);

    expect(config.writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({ apiToken: token }),
    );
  });

  it("rejects a token without api-key_ prefix", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await program.parseAsync(["node", "abmlib", "login", "invalid_token"]);

    expect(config.writeConfig).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);

    spy.mockRestore();
    process.exitCode = undefined as any;
  });

  it("stores custom API URL when --api-url is provided", async () => {
    const token = "api-key_" + "b".repeat(64);
    await program.parseAsync([
      "node",
      "abmlib",
      "login",
      token,
      "--api-url",
      "https://custom.api.dev/api/v1",
    ]);

    expect(config.writeConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        apiToken: token,
        apiUrl: "https://custom.api.dev/api/v1",
      }),
    );
  });
});
