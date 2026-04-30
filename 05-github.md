---
title: GitHub backup
nav_order: 6
---

# GitHub backup

## Why version-control a notes vault

Three reasons:

1. **Off-site backup.** If your laptop dies, `git clone` brings the vault back exactly as it was at the last commit.
2. **History.** Every note is timestamped. You can see when an idea first appeared, what you wrote about a paper a month ago, and what you changed later.
3. **Recovery from mistakes.** Accidentally deleted a folder? `git checkout` restores it. The author of this guide has used this exact mechanism to recover four literature notes that vanished during a vault folder move — the auto-backup committed the deletions, but git history made restoration trivial.

## Setup

1. Create a private GitHub repo for your vault (do NOT make it public — your literature notes contain other peoples copyrighted abstracts and your own thoughts).
2. In the vault folder: `git init && git add . && git commit -m "initial"`.
3. `git remote add origin git@github.com:USERNAME/your-vault.git && git push -u origin main`.
4. Install the Obsidian Git plugin. Settings → Obsidian Git:
   - **Auto-backup interval:** 30 minutes (lower is twitchier; higher is less safe).
   - **Auto-backup after file change:** off (otherwise every save triggers a commit and you cannot quickly undo).
   - **Auto-pull on boot:** on if you sync between machines.

## The mass-deletion guard

By default, Obsidian Git will faithfully commit a "you accidentally deleted everything" event in seconds. To prevent this, BibFlow ships a pre-commit hook in `.git/hooks/pre-commit` that **refuses any commit with 10+ deletions** unless explicitly bypassed with `--no-verify`.

If you genuinely need to delete that many files (a major refactor), do it intentionally:

```bash
git commit --no-verify -m "refactor: <reason>"
```

Otherwise the hook saves you from the most common silent-loss scenario.
