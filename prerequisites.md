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
