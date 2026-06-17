---
title: Obsidian
parent: Setup
nav_order: 2
---

# Obsidian

## Install the app

Download from [obsidian.md](https://obsidian.md). Run the installer.

## Clone BibFlow as your starting vault

In Terminal:

```bash
cd ~/Documents/Masterarbeit
git clone https://github.com/Leon-Muehlenbruch/BibFlow.git 02_Notes
```

A fresh copy of the BibFlow scaffolding lands at `02_Notes/`.

## Open the vault

Obsidian → Open vault → Open folder as vault → pick `02_Notes/`.

The folder pane shows `0 Meta/`, `1 Literature/`, `2 Wiki/`, `9 Orga/`, etc., pre-populated with templates and scripts.

## Verify community plugins are enabled

Settings → Community plugins. These ship with the vault and should already be enabled:

- Templater
- Dataview
- Obsidian Git
- Zotero Integration
- Juggl (optional, for inline graph view)

If any are missing or disabled, enable them.

## Enable the custom CSS snippet

Settings → Appearance → CSS snippets. Toggle on **zotero-highlights** (ships at `.obsidian/snippets/zotero-highlights.css`).

Without this, your imported Zotero highlights still render — just in a flat browser-default colour rather than matching the Zotero palette.

## Optional: PDF TOC extraction

Most commands work immediately. Two need a small Python dependency: **Refresh TOC** reads a PDF's bookmark outline (`pypdf`), and **Convert Paper to Markdown** turns a PDF into searchable full text (`pymupdf4llm`). Templater's *User script files* folder is already pointed at `9 Orga/Templater Scripts/`, so all you add is a self-contained venv. From the vault root in Terminal:

```bash
cd "9 Orga/Templater Scripts"
python3 -m venv .venv
.venv/bin/pip install pypdf pymupdf4llm
```

The helpers auto-detect this venv and fall back to a system `python3` if it is missing. The `.venv/` is git-ignored, so set it up once per machine. Full notes live in `9 Orga/Templater Scripts/README.md`. Skip this if you use neither feature — everything else still works.
