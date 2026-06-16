---
title: Glossary
nav_order: 99
---

# Glossary

| Term                      | Meaning                                                                       |
|---------------------------|-------------------------------------------------------------------------------|
| **citekey**               | short string identifying a paper (`chuo2020insights`); set by Better BibTeX   |
| **BibTeX / BibLaTeX**     | plain-text bibliography format; BibLaTeX is the modern variant                |
| **DOI**                   | unique permanent paper identifier                                             |
| **Better BibTeX**         | Zotero plugin: stable citekeys, auto-exported `.bib`                          |
| **Zotero Integration**    | Obsidian plugin: imports Zotero items via a Markdown template                 |
| **Templater**             | Obsidian plugin: runnable templates (action commands)                         |
| **Dataview**              | Obsidian plugin: SQL-like queries over notes                                  |
| **Obsidian Git**          | Obsidian plugin: auto-commit and push the vault                               |
| **OpenAlex**              | free bibliographic database; used by Paper Search and Paper Metrics           |
| **FWCI**                  | Field-Weighted Citation Impact; normalised citation count                     |
| **persist block**         | template syntax that survives Zotero re-imports                               |
| **reading status**        | a `#paper/<state>` tag (`to-read`, `skimmed`, `referenced`, `fully-read`) on a note; drives the Reading Queue |
| **alias**                 | alternative name in a note's frontmatter; lets `[[Author Year]]` wikilinks resolve to its citekey note |
| **user script (`tp.user`)** | a JavaScript helper in `9 Orga/Templater Scripts/` that Templater exposes as `tp.user.<name>` |
| **pypdf**                 | Python library that reads a PDF's bookmark outline; powers Refresh TOC        |
