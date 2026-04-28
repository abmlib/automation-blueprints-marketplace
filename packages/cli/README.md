# @automation-blueprints/cli

Command-line tools to **validate** and **publish** automation blueprint DSL files to [abmlib.dev](https://abmlib.dev) using API token authentication.

## Installation

From this repository:

```bash
npm install -g .
# Or from npm when published:
# npm install -g @automation-blueprints/cli
```

Local development dependency (_workspace_):

```bash
npm install
npm run build --workspace=@automation-blueprints/cli
```

The `abmlib` binary is exposed from `package.json` `bin`.

## Commands

| Command | Description |
|---------|-------------|
| `abmlib login` | Store an API token in `~/.abmlib/config.json` (or use `ABMLIB_API_TOKEN`) |
| `abmlib validate <file>` | Validate a YAML/JSON blueprint locally with `@automation-blueprints/dsl` |
| `abmlib publish <file>` | Validate, then create or update a blueprint via the API (`POST /blueprints` or `POST /blueprints/:slug/versions`) |

Create API tokens in your **Profile → Settings** on abmlib.dev (`POST /me/api-tokens`).

- `ABMLIB_API_TOKEN` — Plaintext token (alternative to `abmlib login`)
- `ABMLIB_API_URL` — API base URL (default `https://abmlib.dev/api/v1`; also configurable in `~/.abmlib/config.json` as `apiUrl`)

## Dependencies

- `@automation-blueprints/dsl` — Local validation
- `commander` — CLI framework
- `yaml` — YAML parsing for publish/validate

## License

See repository root (Apache-2.0).
