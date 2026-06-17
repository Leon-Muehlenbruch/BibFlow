# CLAUDE.md — BibFlow vault

Instructions for an AI assistant (e.g. Claude Code) working in this vault.
Claude Code reads this file automatically at the start of every session, so
keep it short, true, and up to date.

## What this is

A **BibFlow** literature-workflow vault — an Obsidian vault that joins Zotero,
Obsidian, Word/LaTeX, and GitHub. You help maintain it: importing and
synthesising papers, running the helper scripts, keeping notes linked, and
committing changes.

## Folder map

| Path | Role |
|------|------|
| `0 Meta/Library/`        | Dataview dashboards + Python helpers. The tables are generated — don't hand-edit them. |
| `0 Meta/Planning/`       | hand-written planning (Roadmap, brief). |
| `1 Literature/Paper Notes/` | one note per paper; filename **is** the citekey. |
| `1 Literature/Topics/`   | topic MOCs — synthesise papers by theme (see the "update topics" workflow). |
| `2 Wiki/Concept Notes/`  | atomic concept notes (feed the Glossary). |
| `2 Wiki/Method Notes/`   | protocols, procedures. |
| `3 Writing/`             | drafts; new sections start from `9 Orga/Templates/Draft Section Block.md`. |
| `9 Orga/Templates/`      | note templates (Literature Note, Concept Note, Draft Section Block). |
| `9 Orga/Templater/`      | Templater action commands (the Launcher + per-paper/bulk actions). |
| `9 Orga/Templater Scripts/` | `tp.user.*` JS helpers + `extract_pdf_toc.py`. |

## Conventions

- **Language & quotes**: write your own prose in the vault's working language. **Never translate or alter a verbatim source quote** — keep it byte-for-byte in the source's language (quote marks, numbers, units, page refs unchanged).
- **Citekeys**: Better-BibTeX style `authoryeartitleword` (e.g. `chuo2020insights`). The filename in `1 Literature/` matches the citekey; frontmatter carries `citekey`, `doi`, `year`, `authors`, `intext`, `aliases`.
- **Persist blocks**: in the Literature Note, `{% persist %}` regions (marked `%% begin x %%` … `%% end x %%`) survive Zotero re-imports. **Never overwrite a user's synthesis** — summary, key findings, connections, open questions, references. Only the abstract / TOC / status / highlight machinery is regenerated.
- **Highlights**: Yellow → General, Green → Key terms, Blue → Media.
- **Reading status**: `#paper/{to-read, skimmed, referenced, fully-read}` in the status block; drives the Reading Queue board.

## Workflows

- **"update topics"** — rebuild/extend the topic MOCs in `1 Literature/Topics/`
  from the analysed per-paper notes. Runs via the **`update-topics` skill**
  (`.claude/skills/update-topics/`).

## Helper scripts

Run from the vault root (or via the Obsidian **Launcher**, Option+T):

- `python3 "0 Meta/Library/fetch_metrics.py"` — rebuild `Paper Metrics.md`.
- `python3 "0 Meta/Library/fetch_references.py <citekey>"` — write `## Cited works` for one paper.
- PDF-TOC extraction needs `pypdf` in `9 Orga/Templater Scripts/.venv` (see that folder's `README.md`).
- "Convert Paper to Markdown" (Launcher) writes the PDF's searchable full text to `1 Literature/Full Text/`; needs `pymupdf4llm` in that same venv.

Before committing changes to a helper, sanity-check it: `python3 -m py_compile <file>`.

## Git

Single-maintainer vault: commit **directly to the default branch** (`main`);
the documentation site lives on the separate `docs` branch. Commit when the
user asks. (Adjust this if you adopt a branch/PR flow.)

A pre-commit guard (`.githooks/pre-commit`) blocks any commit deleting 10+
files — activate per clone with `git config core.hooksPath .githooks`. For a
deliberate large deletion, use `git commit --no-verify`.

## Continuity across sessions

A fresh chat has no memory of the last one. To resume where the previous
session stopped:

- **Read first**: check your persistent memory (and this file) at the start.
- **Record durable facts** — decisions, project state, gotchas, open threads —
  as memory entries (one fact per file, indexed in a `MEMORY.md`). Write/update
  them as you work, not only at the end.
- **Leave a trail in the repo** for anything that should travel with the vault:
  a short note in `0 Meta/Planning/` beats relying on local memory alone.
- **End a session** by summarising what changed, what's verified, and what's
  next — so the next session resumes without re-deriving context.
