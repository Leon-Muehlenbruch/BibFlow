---
title: Tool stack
nav_order: 2
---

# Tool stack

BibFlow joins five tools. Each has a single, well-defined responsibility. None of them needs to know much about the others — the connections are thin and explicit.

## Finder (the file system)

Your project lives in one folder on disk:

```
Masterarbeit/
├── 00_Admin/         (supervisor briefs, deadlines, contracts)
├── 01_Literature/    (paper PDFs — these stay in Zotero, not here)
├── 02_Notes/         (the Obsidian vault link)
├── 03_Experiments/
├── 04_Analysis/
├── 05_Figures/
├── 06_Thesis/        (the writing — Word .docx OR LaTeX project)
└── 07_Presentation/
```

Numbered prefixes keep the order stable in Finder. The Obsidian vault is one of these folders (typically `02_Notes/`); GitHub backs up that one folder.

## Zotero

The reference manager. Imports papers from any browser via the Zotero Connector, stores PDFs in a local library, lets you read and annotate them, and exports a BibTeX file for citations. Three plugins:

- **Better BibTeX** — generates stable citekeys (`lastname2023firstword`) and auto-exports a fresh `.bib` file every time you change something.
- **Zotero Integration (Obsidian-side, not Zotero)** — pushes paper metadata + highlights into Obsidian.
- **Zotero Word Add-in** — drops `\cite{...}` equivalents directly into Word as you type.

## Obsidian

The knowledge base. Each paper gets one Markdown note; each concept gets another; everything is wikilinked. The vault contains:

- `0/` — control notes and Python scripts (search, references, metrics).
- `1 Literature/` — one note per paper.
- `2 Wiki/` — concept notes (atomic ideas), method notes.
- `3 Writing/` — drafts, exported chapters.
- `9 Orga/Templates/` and `9 Orga/Templater/` — the templates that produce the literature notes and the macros that drive the scripts.

## Word or LaTeX

Where the thesis lives. BibFlow is agnostic — both work. Word is faster to start; LaTeX gives reproducibility and better long-document handling. Both consume the same `.bib` file from Zotero.

## GitHub

A free, off-site backup of the Obsidian vault. The Obsidian Git plugin commits and pushes on a 30-minute timer; if you ever lose your laptop or your local copy gets corrupted, `git clone` brings everything back.
