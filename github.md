---
title: GitHub backup
parent: Setup
nav_order: 3
---

# GitHub backup

The cloned vault still points at the upstream BibFlow repo. Switch it to your own private repo so backups go where you want.

## Create your private repo

1. github.com → New repository.
2. Name: `thesis-vault` (or anything).
3. Visibility: **Private**. Your literature notes contain copyrighted abstracts and your own thoughts.
4. Skip README, .gitignore, license — the cloned vault already has those.

## Switch the local remote

Inside the cloned vault:

```bash
git remote set-url origin git@github.com:USERNAME/thesis-vault.git
git push -u origin main
```

Replace `USERNAME` with your GitHub username.

## Configure auto-backup

Obsidian → Settings → Obsidian Git:

| Setting                         | Value      |
|---------------------------------|------------|
| Auto-backup interval            | 30 minutes |
| Auto-backup after file change   | off        |
| Auto-pull on boot               | on (if you sync between machines) |

## Mass-deletion guard

The vault ships with a pre-commit hook at `.git/hooks/pre-commit` that refuses commits with 10+ deletions. To bypass intentionally:

```bash
git commit --no-verify -m "<reason>"
```

This catches the most common silent-loss scenario: a folder move that drops files mid-flight, then auto-backup commits the deletions before you notice.
