---
title: Daily workflow
nav_order: 5
---

# Daily workflow

A typical paper goes through six steps:

## 1. Capture

You read about the paper somewhere. Click the **Zotero Connector** button in the browser. Zotero saves the metadata and (where available) the PDF.

## 2. Read & annotate

Open the PDF in Zotero. Use the highlighter tool:

- **Yellow** for general highlights (the bulk).
- **Green** for terms and phrases you want to remember (sparingly).

Add inline notes to highlights when you want to capture your reaction or a question.

## 3. Import to Obsidian

In Obsidian, hit Option+T → "Import Paper from Zotero" → search for the paper → Enter. The Literature Note template runs and produces a new note in `1 Literature/`.

The first time you import a paper, the note shows the highlights you made and otherwise has empty `summary` / `findings` / `connections` / `questions` blocks for you to fill in.

## 4. Synthesise

Fill in the persist blocks **in your own words**:

- **Summary** — 3-5 sentences, what the paper does.
- **Key findings** — bullet list of concrete results.
- **Connections** — wikilinks to other paper notes (`[[zhang2023microbial]]`) and concept notes (`[[MICP]]`).
- **Open questions** — what didnt you understand? what would you want to investigate?

This is the step where you actually learn. The Highlights are raw material; the synthesis is yours.

## 5. Cite in your draft

Open Word or LaTeX. Type or insert the citekey:

- **Word + Zotero plugin:** click "Add Citation" in the toolbar, search the title, insert.
- **LaTeX + biblatex:** type `\parencite{chuo2020insights}` directly. The same citekey thats in your Obsidian frontmatter.

The bibliography updates automatically.

## 6. Backup

Nothing to do — the Obsidian Git plugin auto-commits every 30 minutes and pushes to GitHub. If you ever want to manually checkpoint, hit Option+T → Show Git Status / Commit and Sync Now.

---

## What does NOT belong in the literature note

The Literature Note is about *what the paper says* and *how it connects*. Things that DO NOT belong:

- general thoughts about the topic (those go in concept notes under `2 Wiki/Concept Notes/`)
- methodological recipes (those go in `2 Wiki/Method Notes/`)
- experiment results (`3 Experiments/`)
- thesis prose (`6 Thesis/`)

Atomic notes are the foundation; everything above stitches together specific extractions.
