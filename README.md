# Craft Codex Studio

Craft Codex Studio is a local, Codex-first workbench for studying mature websites and building a clean-room implementation in a separate project folder. It combines evidence capture, project state, resumable Codex sessions, MCP integration, and explicit execution approvals.

## Workflow

```sh
npm install
npm link

craft-codex init --project ./demo --target https://example.com --request "Recreate the public landing page"
craft-codex study --project ./demo
craft-codex build --project ./demo
craft-codex status --project ./demo
```

The project layout is:

```text
demo/
  craft-codex.json       # target, request, lifecycle status
  evidence/              # captured HTML and structured observations
  app/                   # Codex-generated implementation
  checks/                # later visual/behavior comparison results
  .craft-codex-session.json
```

`study` captures public HTML metadata and links without sending credentials or reading the target site's private files. `build` asks Codex to read the evidence and work inside `app/` using the workspace-write sandbox. Later iterations can use the same project and saved Codex thread.

## Codex connection

```sh
craft-codex doctor
craft-codex setup --dry-run
craft-codex setup
craft-codex mcp
```

The bridge discovers `craft-anything-cli` from `CRAFT_ANYTHING_CLI`, `PATH`, and common macOS bundle locations. It preserves Codex configuration and does not read or store credentials. High-risk Craft Anything tools stay blocked unless explicitly started with `--allow-run`.

## Product direction

The next layers are visual capture at fixed viewport sizes, screenshot/pixel comparison, browser interaction traces, responsive checkpoints, component-level repair prompts, and a local preview/check loop. The current project model is designed so those checks can be added without changing the Codex session contract.
