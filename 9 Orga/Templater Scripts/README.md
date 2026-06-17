# Templater user scripts

Helpers that the Templater plugin loads as `tp.user.<name>` once the
**User script files** folder is pointed at this directory.

## Setup (once)

1. **Templater settings → User script files** → set folder to:
   ```
   9 Orga/Templater Scripts
   ```
   (Templater will then auto-load every `.js` in here.) BibFlow already
   ships this setting pre-configured in `.obsidian/`, so a fresh clone
   works out of the box — this step is only needed if you re-point it.

2. Install the Python helpers' dependencies. Apple's bundled Python
   blocks global pip installs (PEP 668), so use a self-contained venv.
   From your vault root:
   ```bash
   cd "9 Orga/Templater Scripts"
   python3 -m venv .venv
   .venv/bin/pip install pypdf pymupdf4llm
   ```
   (`pypdf` powers the TOC helper; `pymupdf4llm` the PDF→Markdown
   converter.) The `.venv/` is git-ignored, so set it up once per
   machine. The JS wrappers auto-detect this venv at `.venv/bin/python`
   and fall back to system `python3` if it is missing.

3. Verify by running the **Refresh TOC** Templater command (in
   `9 Orga/Templater/Refresh TOC.md`) on an existing literature note.
   You should see a notice "Refreshing TOC for <citekey>…" then "TOC
   refreshed". A `## Table of contents` block appears (or is updated)
   in the note, populated from the PDF's bookmark outline.

## What's here

- `extract_pdf_toc.py` — looks up a citekey in `~/Zotero/zotero.sqlite`,
  finds the first PDF attachment, prints a nested Markdown bullet list
  of the PDF's outline with page numbers. Read-only; copies the DB to a
  tempfile so it doesn't fight Zotero's lock.
- `extractPdfToc.js` — Templater user function that shells out to the
  Python helper and returns its stdout. Exposed as `tp.user.extractPdfToc`.
- `pdf_to_markdown.py` — resolves the same Zotero PDF, converts it to
  Markdown with `pymupdf4llm`, and writes
  `1 Literature/Full Text/<citekey> (full text).md`. Prints the path.
  Born-digital PDFs need nothing extra; scanned / image-only pages are
  OCR'd automatically **if Tesseract is installed** (`brew install
  tesseract`), otherwise those pages yield little text.
- `pdfToMarkdown.js` — Templater user function that runs it and returns
  the new file's vault-relative path. Exposed as `tp.user.pdfToMarkdown`.

## Wiring TOC into the import flow

Two ways to use this:

**(a) On-demand via the Refresh TOC command.** Bind a hotkey in Templater
settings → Template Hotkeys → `9 Orga/Templater/Refresh TOC.md`. Run it
on the active literature note whenever you want the TOC populated or
re-extracted.

**(b) Automatic during Zotero import.** Add a persist block to
`9 Orga/Templates/Literature Note.md`, between the Abstract and
Highlights sections:

```markdown
---
## Table of contents
{% persist "toc" %}{% if isFirstImport %}
<!-- run "Refresh TOC" Templater command to populate -->
{% endif %}{% endpersist %}
```

On the *first* import, an empty TOC block is created. Run Refresh TOC
once and it stays put across all subsequent re-imports (Zotero
Integration's persist block keeps it untouched).

If you want truly hands-off auto-population on import, you'd need
Zotero Integration's "Run Templater on import" toggle (in its plugin
settings) and an inline `<%* … %>` snippet inside the persist block —
but that mixes Nunjucks and Templater and tends to be brittle. The
**Refresh TOC** command + a hotkey is more reliable.

## Edge cases & where AI/human review still helps

The Python helper deliberately doesn't try to be clever:

- **Damaged bookmarks.** Springer/Adobe InDesign sometimes drops
  punctuation when generating outlines (e.g. `cementconcrete` instead of
  `cement/concrete`, or missing hyphens in `selfhealing`). The script
  reproduces them as-is. A quick human pass — or one LLM call comparing
  bookmarks against the actual section headings on each page — fixes
  this.
- **PDFs without bookmarks.** Older preprints, dissertations, conference
  proceedings often have an empty outline. The script prints an HTML
  comment to that effect. Fallbacks to consider: heuristic font-size /
  boldness extraction (e.g. via `pdfplumber`), or feeding the first few
  pages of text to an LLM and asking it to reconstruct the section
  hierarchy.
- **Multiple PDFs per item.** The script picks the first PDF
  attachment ordered by attachment item ID. If you have a manuscript +
  supplementary material and the wrong one comes first, the lookup in
  `extract_pdf_toc.py:find_pdf_path` is the place to add a smarter
  selector (prefer non-supplementary, prefer largest, etc.).
- **Front-/back-matter noise.** Some publishers' bookmarks include
  "Acknowledgements", "Author contributions", "Conflict of interest", or
  per-figure entries. None of those are filtered here; if they bother
  you, drop a `SKIP_TITLES = {...}` set into the helper.
