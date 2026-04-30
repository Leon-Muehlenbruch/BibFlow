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

The folder pane shows `0/`, `1 Literature/`, `2 Wiki/`, `9 Orga/`, etc., pre-populated with templates and scripts.

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
