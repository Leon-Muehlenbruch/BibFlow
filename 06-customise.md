---
title: Customisation
nav_order: 7
---

# Customisation

BibFlow is a starting point. The most common adaptations:

## Highlight colours

The default mapping is yellow=general, green=key-term. To add red for "questionable / disagreement":

1. Open `9 Orga/Templates/Literature Note.md`.
2. Copy the `### Key terms` block, change `Yellow` → `Red` and `hltr-green` → `hltr-red`, and rename the heading.
3. The CSS already styles all 8 Zotero colours (`mark.hltr-red`, `…blue`, `…purple`, etc.) — you do not need to touch the snippet.

## Citation style

Word side: change in the Zotero toolbar (Document Preferences → Style).
LaTeX side: change `style=authoryear` in `thesis.cls` to whatever your supervisor wants (`numeric`, `nature`, `apa`, etc.).

## Vault structure

The numbered folders are convention, not law. If you prefer flat, move things around — only `0/`, `1 Literature/`, `2 Wiki/`, and `9 Orga/` are referenced by the templates and scripts. Other folders are free.

If you change `1 Literature/`, update the constant at the top of `0/fetch_references.py`, `0/fetch_metrics.py`, and `0/fetch_search.py`:

```python
LIT_DIR = VAULT_ROOT / "1 Literature"
```

## Institute thesis template

A LaTeX class file (`thesis.cls`) tuned for Word-template-style output is shipped separately at `06_Thesis/` in the parent project. To replicate for a different institute, run the inspector against the institutes Word template:

```bash
python3 0/inspect_docx.py /path/to/institute/Thesis_Template.docx
```

It will print page geometry, fonts, heading hierarchy, colours, and numbering schemes. From there, edit `thesis.cls` to match.
