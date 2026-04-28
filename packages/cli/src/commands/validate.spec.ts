import * as dslFile from "../dsl-file";

jest.mock("../dsl-file");

jest.mock("@automation-blueprints/dsl", () => ({
  validateDsl: jest.fn(),
}));

import { Command } from "commander";
import { registerValidate } from "./validate";
import { validateDsl } from "@automation-blueprints/dsl";

describe("abmlib validate", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerValidate(program);
    jest.clearAllMocks();
    process.exitCode = undefined as any;
  });

  it("reports success for a valid DSL file", async () => {
    (dslFile.readDslFile as jest.Mock).mockReturnValue({ id: "bp-1" });
    (validateDsl as jest.Mock).mockReturnValue({
      ok: true,
      errors: [],
      warnings: [],
    });

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await program.parseAsync(["node", "abmlib", "validate", "test.yaml"]);

    expect(validateDsl).toHaveBeenCalledWith({ id: "bp-1" });
    expect(spy).toHaveBeenCalledWith("Validation passed.");
    expect(process.exitCode).toBeUndefined();

    spy.mockRestore();
  });

  it("reports errors for an invalid DSL file", async () => {
    (dslFile.readDslFile as jest.Mock).mockReturnValue({});
    (validateDsl as jest.Mock).mockReturnValue({
      ok: false,
      errors: ["name: is required", "steps: is required"],
      warnings: [],
    });

    const spyErr = jest.spyOn(console, "error").mockImplementation(() => {});

    await program.parseAsync(["node", "abmlib", "validate", "bad.yaml"]);

    expect(process.exitCode).toBe(1);
    expect(spyErr).toHaveBeenCalledWith("Validation failed.\n");

    spyErr.mockRestore();
    process.exitCode = undefined as any;
  });

  it("reports error when file cannot be read", async () => {
    (dslFile.readDslFile as jest.Mock).mockImplementation(() => {
      throw new Error("File not found: /missing.yaml");
    });

    const spyErr = jest.spyOn(console, "error").mockImplementation(() => {});

    await program.parseAsync(["node", "abmlib", "validate", "/missing.yaml"]);

    expect(process.exitCode).toBe(1);
    expect(spyErr).toHaveBeenCalledWith(
      expect.stringContaining("File not found"),
    );

    spyErr.mockRestore();
    process.exitCode = undefined as any;
  });
});
