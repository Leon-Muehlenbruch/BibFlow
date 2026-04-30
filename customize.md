---
title: Customisation
parent: Setup
nav_order: 5
---

# Customisation

The defaults work. Adapt what does not fit.

## Highlight colours

Map other Zotero colours to imported sections.

In `9 Orga/Templates/Literature Note.md`, copy the `### Key terms` block, change `Yellow` → e.g. `Red` and `hltr-green` → `hltr-red`. The CSS at `.obsidian/snippets/zotero-highlights.css` already styles all 8 Zotero colours; no CSS edit needed.

## Citation style

Word: Zotero toolbar → Document Preferences → Style.
LaTeX: edit `style=authoryear` in `thesis.cls`.

## Vault folder names

Only `0/`, `1 Literature/`, `2 Wiki/`, and `9 Orga/` are referenced by templates and scripts. The rest are free.

If you rename `1 Literature/`, update the constant at the top of:

- `0/fetch_metrics.py`
- `0/fetch_references.py`
- `0/fetch_search.py`

```python
LIT_DIR = VAULT_ROOT / "1 Literature"
```

## Institute thesis template

Run the inspector against your institutes Word template:

```bash
python3 0/inspect_docx.py /path/to/Thesis_Template.docx
```

It prints page geometry, fonts, heading hierarchy, colours, numbering — everything needed to write a matching `thesis.cls`.
