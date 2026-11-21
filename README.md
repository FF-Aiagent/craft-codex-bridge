# Craft Codex Bridge

A small macOS + Node.js bridge that connects Codex to an installed `craft-anything-cli` through a controlled MCP stdio proxy.

## Install

```sh
npm install
npm link
craft-codex doctor
```

The bridge never reads or stores Codex credentials. It discovers `craft-anything-cli` from `CRAFT_ANYTHING_CLI`, `PATH`, and common macOS application bundle locations.

## Connect Codex

Preview the change first:

```sh
craft-codex setup --dry-run
craft-codex setup
```

The command updates `$CODEX_HOME/config.toml` (or `~/.codex/config.toml`), preserves unrelated configuration, and writes a `.craft-codex.backup` copy before changing an existing file.

## MCP safety

`craft-codex mcp` starts Craft Anything with `--all-tools`, but blocks build, command execution, and generated-asset tools unless explicitly started with `--allow-run`. This keeps Codex approval and Craft Anything consent as separate checks. The bridge does not set Codex's global default approval mode.

## Resumable sessions

```sh
craft-codex resume --project ./my-project --prompt "Continue the current build"
```

Session metadata is stored in `.craft-codex-session.json` in the project folder and contains only the thread id and runtime paths. `--ephemeral` and `--worktree` are rejected because they cannot be safely resumed by the supported Codex CLI flow.
