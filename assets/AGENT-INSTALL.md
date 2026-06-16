# AGENT-INSTALL.md — install BibFlow with an AI agent

This file is written **for an AI agent** (Claude Code, or the Claude desktop
app with Desktop Commander) that has shell + filesystem access on the user's
machine. It is the runbook for the request:

> "Install BibFlow as a new Obsidian vault on my computer."

Work through it top to bottom. **Run the shell commands yourself.** For the
handful of GUI / external-app steps (marked **USER**), give the user exact
instructions and wait for them to confirm before continuing. Confirm the
install location and any system-package installs **before** running them.

This runbook targets **macOS (Apple Silicon)** — the vault ships a
macOS/arm64 helper binary for the Zotero connector. On Intel macs, Windows,
or Linux, adapt the prerequisite installs (Steps 1) and tell the user; the
rest is the same.

What ships inside the repo, so you do **not** install it: all Obsidian
community plugins (code included), the theme, CSS snippets, hotkeys, and the
Zotero Integration import format ("Literature Note"). A clone is a working
vault; the user only has to trust the plugins once and connect their Zotero.

---

## Step 0 — Confirm with the USER

Ask, and wait for answers:

1. **Where should the vault live?** Suggest `~/Obsidian Vaults/<name>` or
   `~/Documents/<name>`. Call the chosen absolute path `VAULT_PATH` below.
2. **Do they want a private GitHub backup?** If yes, get the repo URL (or you
   can create one in Step 6 with `gh`). If no, skip Step 6.
3. **Confirm the OS** is macOS. If not, you will adapt Step 1.

Do not install system packages until the user has confirmed Step 0.

---

## Step 1 — Prerequisites (check first, install only what's missing)

Check each; install the missing ones; verify. Ask before the first install.

```bash
# Homebrew (the package manager the rest use)
command -v brew || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# git, python3, node — usually present; install what's missing
git --version    || xcode-select --install
python3 --version || brew install python
node --version    || brew install node

# Obsidian itself
ls -d /Applications/Obsidian.app 2>/dev/null || brew install --cask obsidian
```

Expected: each `--version` prints a version; `/Applications/Obsidian.app`
exists. If a command is missing after install, stop and tell the user.

---

## Step 2 — Clone the vault

```bash
# Refuse to clobber an existing directory
test -e "VAULT_PATH" && echo "Path exists — pick another or confirm overwrite" || \
  git clone https://github.com/Leon-Muehlenbruch/BibFlow.git "VAULT_PATH"
```

Verify the structure:

```bash
ls "VAULT_PATH"   # expect: "0 Meta", "1 Literature", "2 Wiki", "9 Orga", CLAUDE.md, README.md, .obsidian
```

---

## Step 3 — Python helper venv (for the PDF-TOC feature)

The metrics / references / search helpers use only the standard library and
need nothing extra. The PDF table-of-contents helper needs `pypdf`:

```bash
cd "VAULT_PATH/9 Orga/Templater Scripts"
python3 -m venv .venv
.venv/bin/pip install pypdf
.venv/bin/python -c "import pypdf; print('pypdf', pypdf.__version__)"
```

The `.venv/` is git-ignored (per-machine). Skip this step if the user does
not want the TOC feature.

---

## Step 4 — Open in Obsidian — **USER**

```bash
open -a Obsidian "VAULT_PATH"
```

Then tell the user, verbatim:

> Obsidian will ask to **"Trust author and enable plugins."** Click it. That
> turns on Templater, Dataview, Obsidian Git, and the Zotero connector — all
> already bundled and configured. If you are not prompted: Settings →
> Community plugins → **Turn on community plugins**, then enable them.

Wait for the user to confirm the plugins are enabled before continuing.

---

## Step 5 — Verify the vault

```bash
# helpers compile
for f in "VAULT_PATH/0 Meta/Library/"*.py "VAULT_PATH/9 Orga/Templater Scripts/extract_pdf_toc.py"; do
  python3 -m py_compile "$f" && echo "ok  $f"
done
```

Ask the user to confirm inside Obsidian: pressing **Option+T** opens the
**Launcher** menu. If it does, Templater is live and the vault works.

---

## Step 6 — GitHub backup (optional) — needs the USER's repo

A fresh clone's `origin` points at the upstream BibFlow repo. Point it at the
user's **private** repo (their notes contain copyrighted abstracts).

If they have a repo URL:

```bash
git -C "VAULT_PATH" remote set-url origin <USER_REPO_URL>
git -C "VAULT_PATH" push -u origin main
```

If they do not and `gh` is authenticated, create one:

```bash
gh repo create <name> --private --source="VAULT_PATH" --remote=origin --push
```

Then, in Obsidian, the **Obsidian Git** plugin auto-commits on the interval
configured in its settings (Settings → Obsidian Git). Confirm with the user
that auto-backup is on.

> Note: BibFlow's optional mass-deletion pre-commit guard lives in
> `.git/hooks/` and is **not** copied by `git clone`. If the user wants it,
> add it by hand later — it is not required for the vault to work.

---

## Step 7 — Zotero side — **USER** (external apps)

The Obsidian half is now ready. The reference-manager half is set up by the
user in Zotero (you cannot automate the GUI / external installs). Tell them:

1. Install **Zotero** + the **Zotero Connector** browser extension
   (zotero.org/download).
2. Install **Better BibTeX** (stable citekeys) and set a citekey formula.
3. Install the **Zotero Word plugin** if writing in Word.
4. In Obsidian → Settings → **Zotero Integration**, set the **Database** to
   their Zotero. The import format ("Literature Note") is already configured.

Point them at the full walkthrough: <https://leon-muehlenbruch.github.io/BibFlow/>
(Setup → Zotero).

---

## Step 8 — Smoke test

```bash
# Python pipeline reachable from the vault root (no papers yet → empty table is fine)
cd "VAULT_PATH" && python3 "0 Meta/Library/fetch_metrics.py" && echo "helpers run"
```

Once the user has imported their first paper from Zotero (Option+T → Import
Paper from Zotero), the vault is fully operational. Report what you did, what
the user still needs to do (Step 7), and where the vault lives.

---

## Gotchas

- **Platform**: the Zotero connector ships a macOS/arm64 annotation binary.
  On Intel macs or other OSes the connector may need its matching binary —
  let the connector re-download it, or flag it to the user.
- **`origin` points upstream** until Step 6 — do not push to it.
- **Privacy**: keep the backup repo private; literature notes embed
  copyrighted abstracts.
- **Demo content**: `Paper Search.md` and `Paper Metrics.md` ship with example
  results. Clear them whenever the user wants a blank slate.
- **`CLAUDE.md`** in the vault root tells you (the agent) how the vault works
  for ongoing use — read it once the install is done.
