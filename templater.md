---
title: Templater commands
parent: Using
nav_order: 3
---

# Templater commands

All actions reach you from one hotkey: **Option+T** (the Launcher).

## Launcher menu

```
─── Literature ───
Import Paper from Zotero
Fetch References for the current paper
Set Reading Status
Refresh TOC for the current paper
Convert Paper to Markdown
Link In-Text Citations
Promote selection to concept note

Refresh All Literature
Refresh Paper Metrics
─── Git ───
Commit and Sync Now
Show Git Status
```

## Per-paper actions

| Command                              | Effect                                                                                          |
|--------------------------------------|-------------------------------------------------------------------------------------------------|
| Import Paper from Zotero             | opens Zotero Integrations import modal                                                          |
| Fetch References for the current paper | reads the open notes DOI, queries OpenAlex, writes a list of cited works under `## Cited works` |
| Set Reading Status                   | picks one of `#paper/to-read · skimmed · referenced · fully-read` and writes it into the notes status block. Drives the [Reading Queue](vault-tour#reading-queue) board. |
| Refresh TOC for the current paper    | extracts the PDFs bookmark outline (via `extract_pdf_toc.py`) into the notes `## Table of contents` block. Needs the [helper venv](obsidian#optional-pdf-toc-extraction). |
| Convert Paper to Markdown            | converts the PDF to searchable Markdown at `1 Literature/Full Text/<citekey> (full text).md` (via `pymupdf4llm`), then opens it. With many papers, Cmd+F across the vault then pinpoints which paper a quote came from. Needs the [helper venv](obsidian#optional-pdf-toc-extraction). |
| Link In-Text Citations               | wraps parenthetical citations like `(Smith 2023)` in the note body as `[[wikilinks]]` that resolve through each papers `aliases`. Idempotent — safe to re-run. |
| Promote selection to concept note    | takes the selected text, creates `2 Wiki/Concept Notes/<text>.md` from the Concept Note template, replaces the selection with `[[<text>]]`. If the concept already exists, just inserts the wikilink. |

## Bulk actions

| Command               | Effect                                                                                       |
|-----------------------|----------------------------------------------------------------------------------------------|
| Refresh All Literature| re-imports every paper in `1 Literature/` from Zotero, then runs the full post-import chain on each note: repair the status and abstract blocks, re-extract the TOC, regroup highlights by chapter, and re-link in-text citations. Your synthesis blocks are untouched. |
| Refresh Paper Metrics | re-runs `0 Meta/Library/fetch_metrics.py`; rewrites `0 Meta/Library/Paper Metrics.md` with current OpenAlex citations  |

## Helper scripts (`tp.user.*`)

A few commands lean on reusable JavaScript helpers in `9 Orga/Templater Scripts/`, which Templater loads as `tp.user.<name>`. The vault ships with Templaters **User script files** folder already pointed at that directory, so they work out of the box — except the two PDF helpers (TOC extraction and Markdown conversion), which need a one-time Python venv (see [Obsidian setup](obsidian#optional-pdf-toc-extraction)).

| Helper                     | Used by                | Does                                                          |
|----------------------------|------------------------|--------------------------------------------------------------|
| `ensureStatusDefault`      | Refresh All Literature | fills an empty status block with `#paper/to-read`, dedupes tags |
| `ensureAbstract`           | Refresh All Literature | drops a placeholder into an empty abstract block so you always have somewhere to type |
| `extractPdfToc`            | Refresh TOC            | shells out to `extract_pdf_toc.py` for the PDF outline        |
| `pdfToMarkdown`            | Convert Paper to Markdown | shells out to `pdf_to_markdown.py` to write the PDF's full text as Markdown |
| `groupHighlightsBySection` | Refresh All Literature | inserts chapter headings into the Highlights section by page  |
| `linkInTextCitations`      | Link In-Text Citations | wraps `(Author Year)` as `[[wikilinks]]`                       |

Each helper is idempotent and no-ops if its target block is missing, so they are safe to run on any note and safe to re-run.

## Adding a new command

Edit `9 Orga/Templater/Launcher.md`. Add a row to the `items` array:

```js
{ kind: "template", label: "Your Action", path: "9 Orga/Templater/Your Action.md" }
```

Save. The new entry appears in the picker on the next Option+T.
