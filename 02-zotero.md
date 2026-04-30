---
title: Zotero setup
nav_order: 3
---

# Zotero setup

## Install Zotero

Download from [zotero.org](https://www.zotero.org). Install the **Zotero Connector** browser extension at the same time — it adds a one-click "Save to Zotero" button on any paper page (publisher site, Google Scholar, OpenAlex, etc.).

## Better BibTeX

The single most important plugin for this workflow.

1. Download the latest `.xpi` from [retorquere/zotero-better-bibtex/releases](https://github.com/retorquere/zotero-better-bibtex/releases).
2. In Zotero: Tools → Add-ons → gear icon → "Install Add-on From File" → pick the `.xpi`.
3. Restart Zotero. Settings → Better BibTeX:
   - **Citation key formula:** `auth.lower + year + title.condense.lower.skipwords.select(1,1)`
     This produces keys like `chuo2020insights` — the same format BibFlow uses everywhere.
   - **Pin citation keys** when first generated so they never silently rename.

### Auto-export a `.bib` file

This is what feeds your Word/LaTeX citations.

1. In your Zotero library: right-click your collection (e.g. "Master Thesis") → Export Collection.
2. Format: **Better BibLaTeX** (or BibTeX if Word).
3. Tick **Keep updated**.
4. Save the file at `06_Thesis/references.bib` (or wherever your thesis project lives).

Now every time you add or edit a paper in Zotero, the `.bib` file rewrites itself. Your thesis always has a current bibliography.

## Word plugin

Zotero ships a Word add-in. Once installed (Tools → Word for macOS Integration → Install), Word gets a "Zotero" toolbar:

- **Add/Edit Citation** — searches your library and inserts a citation.
- **Add/Edit Bibliography** — auto-generates the reference list at the cursor.
- **Document Preferences** — pick a citation style (APA, IEEE, custom CSL).

## Highlight colour conventions

In the Zotero PDF reader, the highlight tool has 8 colours. BibFlow assigns a meaning to two by default; you can extend.

| Colour | Meaning                                        |
|--------|------------------------------------------------|
| Yellow | General highlight: claims, facts, useful prose |
| Green  | Key term or phrase to remember (definitions)   |

When the paper imports into Obsidian, yellow highlights land under "General" and green under "Key terms" — automatic.

See [Obsidian setup](03-obsidian) for how the colours are read.
