---
title: Working with Claude
nav_order: 4
---

# Working with Claude

BibFlow is built to be driven by an AI coding assistant. [Claude Code](https://claude.com/claude-code) — Anthropic's CLI — can run the helper scripts, import and synthesise papers, keep notes linked, and commit to GitHub for you. None of this is required; the vault works fine by hand. But if you want the assist, here is the setup.

## What helps to have

- **Claude Code** plus a plan that includes it — Claude **Pro** is enough to start, **Max** for heavy use — or an **Anthropic API key**. Install with `npm install -g @anthropic-ai/claude-code`, then run `claude` from inside the vault folder.
- **Node.js** — Claude Code and most MCP servers run on it. [nodejs.org](https://nodejs.org).
- **Python 3** — the vault's helper scripts need it. See [Prerequisites](prerequisites).
- **GitHub CLI (`gh`)** — for GitHub operations and auth. Plain `git` already handles commit and push; `gh` adds pull requests, issues, and `gh auth login`. Heads-up: creating PRs needs a token with the right scope — if `gh pr create` fails with a permissions error, push the branch and open the PR from the GitHub web UI, or re-auth with `gh auth refresh`.
- **Desktop Commander** *(optional)* — an [MCP server](https://modelcontextprotocol.io) that gives an assistant direct file and terminal access. Claude **Code** (the CLI) already has that natively, so you mainly want Desktop Commander when driving the vault from the Claude **Desktop app** instead.

## Telling Claude how the vault works

The vault ships a **`CLAUDE.md`** at its root. Claude Code reads it automatically at the start of every session: it holds the folder map, the conventions (citekeys, persist blocks, highlight colours, reading status), the helper-script commands, and the git flow. Editing it to match your project is the single most effective way to keep the assistant on track.

[Download `CLAUDE.md`](assets/CLAUDE.md){:download="CLAUDE.md"} · [view the live version on GitHub](https://github.com/Leon-Muehlenbruch/BibFlow/blob/main/CLAUDE.md)

## Permissions

Letting an assistant edit files and run git is powerful — scope it deliberately. The vault ships a conservative **`.claude/settings.json`**:

```json
{
  "permissions": {
    "allow": [
      "Bash(git status:*)", "Bash(git diff:*)", "Bash(git log:*)",
      "Bash(git add:*)", "Bash(git commit:*)",
      "Bash(git fetch:*)", "Bash(git pull:*)"
    ],
    "ask": ["Bash(git push:*)"]
  }
}
```

Read, stage, and commit run without prompting; **push always asks**. It deliberately does **not** auto-allow arbitrary code execution (e.g. `Bash(python3:*)`), so the first time the assistant runs a Python helper it will ask — approve it then. To push unattended, move `Bash(git push:*)` into `allow`; keep personal grants in `.claude/settings.local.json`, which stays out of git.

## Continuity across sessions

A new chat does not remember the last one. Two things bridge that gap:

1. **`CLAUDE.md`** — the durable, in-repo description of how the vault works, read on every session start.
2. **Memory** — Claude Code keeps a persistent, per-project memory. Ask it (or note in `CLAUDE.md`) to record durable decisions and open threads as memory entries, and to summarise progress at the end of a session. The next chat reads those and resumes.

The payoff: stop mid-task, come back days later in a fresh session, and the assistant picks up with the context intact — no re-explaining the vault each time.
