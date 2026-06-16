---
title: Customisation
parent: Setup
nav_order: 5
---

# Customisation

The defaults work. Adapt what does not fit.

## Highlight colours

Yellow → General, Green → Key terms, and Blue → Media are mapped out of the box. To map another Zotero colour to its own section, open `9 Orga/Templates/Literature Note.md`, copy the `### Key terms` block, and change both the colour test and the mark class — e.g. `colorCategory == "Green"` → `"Red"` and `hltr-green` → `hltr-red`, then rename the heading. The CSS at `.obsidian/snippets/zotero-highlights.css` already styles all 8 Zotero colours; no CSS edit needed.

## Citation style

Word: Zotero toolbar → Document Preferences → Style.
LaTeX: set `style=authoryear` in your biblatex setup (`\usepackage[style=authoryear]{biblatex}`).

## Vault folder names

Only `0 Meta/`, `1 Literature/`, `2 Wiki/`, and `9 Orga/` are referenced by templates and scripts. The rest are free.

If you rename `1 Literature/`, update the constant at the top of:

- `0 Meta/Library/fetch_metrics.py`
- `0 Meta/Library/fetch_references.py`
- `0 Meta/Library/fetch_search.py`

```python
LIT_DIR = VAULT_ROOT / "1 Literature"
```
