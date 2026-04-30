---
title: Zotero
parent: Setup
nav_order: 4
---

# Zotero

## Install Zotero and the connector

Download both from [zotero.org/download](https://www.zotero.org/download). Install Zotero first, then the Zotero Connector browser extension. The connector adds a one-click "Save to Zotero" button on any paper page.

## Better BibTeX plugin

Generates stable citekeys and auto-exports a `.bib` file.

1. Download the latest `.xpi` from [Better BibTeX releases](https://github.com/retorquere/zotero-better-bibtex/releases).
2. Zotero → Tools → Add-ons → gear icon → Install Add-on From File → pick the `.xpi`.
3. Restart Zotero.
4. Settings → Better BibTeX → Citation key formula:
   `auth.lower + year + title.condense.lower.skipwords.select(1,1)`
   Produces keys like `chuo2020insights`.
5. Right-click any item → Better BibTeX → Pin BibTeX key. Pin all keys you cite — they then never silently rename.

## Auto-export the bibliography

1. In Zotero, right-click your master collection → Export Collection.
2. Format: **Better BibLaTeX** (or BibTeX if Word).
3. Tick **Keep updated**.
4. Save it next to your thesis document. If you used the suggested project folder from [Prerequisites](prerequisites), that means `~/Documents/Masterarbeit/06_Thesis/references.bib`. Otherwise pick any path; just remember it — Word/LaTeX needs to point at this file.

The file rewrites itself every time you change Zotero.

## Word plugin

Zotero ships an installer.

Zotero → Tools → Word for macOS Integration → Install Microsoft Word Add-in.

Restart Word. A "Zotero" tab appears: **Add/Edit Citation**, **Add/Edit Bibliography**, **Document Preferences**.

## Connect Zotero to Obsidian

Obsidian → Settings → Zotero Integration:

1. Database: Zotero (or Zotero 6, whichever applies).
2. Note Import Format → Add new format:
   - Name: `Literature Note`
   - Output Path: `1 Literature/{{citekey}}.md`
   - Template File: `9 Orga/Templates/Literature Note.md`
3. Settings → Hotkeys → search "Zotero Integration: Insert notes from Zotero" → assign Cmd+Shift+I.

## Highlight colours

In Zoteros PDF reader, the highlighter has 8 colours. BibFlow assigns:

| Colour | Meaning              |
|--------|----------------------|
| Yellow | General highlight    |
| Green  | Key term to remember |

Yellows land under "General" in the imported note, greens under "Key terms". Other colours are styled but unused by default — see [Customisation](customize) to add them.
