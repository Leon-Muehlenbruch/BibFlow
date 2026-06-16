---
title: Prerequisites
parent: Setup
nav_order: 1
---

# Prerequisites

Get these in place before installing anything else.

## Word installed

If you plan to write in Word, install it before Zotero. The Zotero Word plugin only registers itself if Word is already on the machine.

LaTeX users: skip this and ignore Word references throughout.

## A project folder

You will need somewhere on disk to keep the vault. The layout below is one suggestion — not required by anything in BibFlow. The vault works equally well sitting on its own anywhere; this structure just keeps research, drafts, and figures alongside the notes.

```
~/Documents/Masterarbeit/
├── 00_Admin/
├── 01_Literature/
├── 02_Notes/        ← the Obsidian vault will go here
├── 03_Experiments/
├── 04_Analysis/
├── 05_Figures/
├── 06_Thesis/
└── 07_Presentation/
```

Numbered prefixes hold the order in Finder. Substitute your own structure if you prefer.

## A GitHub account

Free at [github.com/signup](https://github.com/signup). The free tier is enough.

## Git on your machine

macOS, in Terminal:

```bash
xcode-select --install
```

If it says "already installed", you are done. Otherwise accept the install dialog.

## Python 3

The library helpers — paper metrics, reference extraction, PDF conversion — run on Python 3. Check with:

```bash
python3 --version
```

Most Macs already have one (the Xcode tools above include it). If it is missing, install via [Homebrew](https://brew.sh): `brew install python`. The metrics / references / search helpers use only the standard library; the optional PDF-TOC feature additionally needs `pypdf` (see [Obsidian setup](obsidian#optional-pdf-toc-extraction)).

## Optional: an AI assistant

BibFlow is built to pair with an AI coding assistant such as [Claude Code](https://claude.com/claude-code) — to run the helpers, import and synthesise papers, and commit to GitHub for you. None of it is required, but if you want the assist it helps to have a Claude plan (Pro or Max) or Anthropic API key, [Node.js](https://nodejs.org), and the [GitHub CLI](https://cli.github.com). The full setup — including the `CLAUDE.md` project file, permissions, and how the assistant continues across sessions — is on its own page: [Working with Claude](claude).
