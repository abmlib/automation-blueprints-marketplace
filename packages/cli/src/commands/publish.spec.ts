import * as dslFile from "../dsl-file";
import * as apiClient from "../api-client";

jest.mock("../dsl-file");
jest.mock("../api-client");

jest.mock("@automation-blueprints/dsl", () => ({
  validateDsl: jest.fn(),
}));

import { Command } from "commander";
import { registerPublish } from "./publish";
import { validateDsl } from "@automation-blueprints/dsl";

describe("abmlib publish", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerPublish(program);
    jest.clearAllMocks();
    process.exitCode = undefined as any;
  });

  const validDsl = {
    id: "bp-1",
    name: "Test Blueprint",
    version: "1.0.0",
    apps: ["slack"],
    trigger: { app: "slack", event: "message" },
    steps: [{ id: "s1", app: "slack", action: "send" }],
  };

  it("publishes a new blueprint when slug is available", async () => {
    (dslFile.readDslFile as jest.Mock).mockReturnValue(validDsl);
    (validateDsl as jest.Mock).mockReturnValue({ ok: true, errors: [] });
    (apiClient.apiRequest as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { available: true },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: { id: "bp-new", slug: "test-blueprint" },
      });

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await program.parseAsync(["node", "abmlib", "publish", "bp.yaml"]);

    expect(apiClient.apiRequest).toHaveBeenCalledTimes(2);

    const slugCheckCall = (apiClient.apiRequest as jest.Mock).mock.calls[0];
    expect(slugCheckCall[0]).toBe("POST");
    expect(slugCheckCall[1]).toBe("/blueprints/check-slug");
    expect(slugCheckCall[2]).toEqual({ slug: "test-blueprint" });

    const createCall = (apiClient.apiRequest as jest.Mock).mock.calls[1];
    expect(createCall[0]).toBe("POST");
    expect(createCall[1]).toBe("/blueprints");
    expect(createCall[2]).toEqual(
      expect.objectContaining({
        title: "Test Blueprint",
        slug: "test-blueprint",
        semver: "1.0.0",
        dslJson: validDsl,
      }),
    );

    expect(process.exitCode).toBeUndefined();
    spy.mockRestore();
  });

  it("adds a new version when slug already exists", async () => {
    (dslFile.readDslFile as jest.Mock).mockReturnValue(validDsl);
    (validateDsl as jest.Mock).mockReturnValue({ ok: true, errors: [] });
    (apiClient.apiRequest as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { available: false },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: { id: "v-new", semver: "1.0.0" },
      });

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await program.parseAsync(["node", "abmlib", "publish", "bp.yaml"]);

    const versionCall = (apiClient.apiRequest as jest.Mock).mock.calls[1];
    expect(versionCall[0]).toBe("POST");
    expect(versionCall[1]).toBe("/blueprints/test-blueprint/versions");

    expect(process.exitCode).toBeUndefined();
    spy.mockRestore();
  });

  it("fails when local validation fails", async () => {
    (dslFile.readDslFile as jest.Mock).mockReturnValue({});
    (validateDsl as jest.Mock).mockReturnValue({
      ok: false,
      errors: ["name: is required"],
    });

    const spyErr = jest.spyOn(console, "error").mockImplementation(() => {});

    await program.parseAsync(["node", "abmlib", "publish", "bad.yaml"]);

    expect(apiClient.apiRequest).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);

    spyErr.mockRestore();
    process.exitCode = undefined as any;
  });

  it("fails when API authentication fails", async () => {
    (dslFile.readDslFile as jest.Mock).mockReturnValue(validDsl);
    (validateDsl as jest.Mock).mockReturnValue({ ok: true, errors: [] });
    (apiClient.apiRequest as jest.Mock).mockResolvedValue({
      ok: false,
      status: 0,
      error: "Not authenticated. Run `abmlib login`",
    });

    const spyErr = jest.spyOn(console, "error").mockImplementation(() => {});

    await program.parseAsync(["node", "abmlib", "publish", "bp.yaml"]);

    expect(process.exitCode).toBe(1);

    spyErr.mockRestore();
    process.exitCode = undefined as any;
  });
});
