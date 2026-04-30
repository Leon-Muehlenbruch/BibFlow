---
title: Overview
layout: home
nav_order: 1
---

# BibFlow

A reproducible **literature workflow** for masters/PhD students and academic researchers, gluing together five free tools you probably already use:

| Tool         | Role                                                        |
|--------------|-------------------------------------------------------------|
| **Finder**   | the canonical file system: where PDFs and the project live  |
| **Zotero**   | reference manager, PDF reader, annotator, BibTeX exporter   |
| **Obsidian** | knowledge base, atomic literature notes, link graph         |
| **Word / LaTeX** | the actual thesis/paper document                        |
| **GitHub**   | versioned backup of the Obsidian vault                      |

Each tool is good in isolation. BibFlow is the **plumbing** that makes them feel like one connected system: highlights flow from Zotero into Obsidian without copy-paste, citations stay in sync, and your vault auto-commits to GitHub on a schedule.

## Why BibFlow exists

Most thesis-writing setups end up as one of two extremes:

- *Word + manual references*: low-tech, fragile, painful to refactor.
- *Full LaTeX + Zettelkasten + custom scripts*: powerful, but takes weeks to assemble and another month to remember how it works.

BibFlow sits in the middle. It is opinionated where it can be (a single Obsidian template, a single citekey format, a single bib export), and pluggable where it must be (works with Word OR LaTeX; works with any university template).

## Who should use it

You should set this up if you are:

- writing a master/PhD thesis and want literature notes to outlive any one document,
- consistently reading 20+ papers and finding it hard to remember which idea came from where,
- already using Zotero but its native notes feel cramped,
- comfortable installing a few apps and editing one or two config files.

You probably should NOT use it if you only need to cite 5 sources or you are uncomfortable with a terminal.

## Where to go next

1. [Tool stack overview](01-tools) — what each piece does and why.
2. [Zotero setup](02-zotero) — install, the Better BibTeX plugin, the Word plugin.
3. [Obsidian setup](03-obsidian) — vault structure, plugins, the templates we ship.
4. [Daily workflow](04-workflow) — read paper → highlight → import → note → cite.
5. [GitHub backup](05-github) — auto-commit the vault, never lose a note again.
6. [Customisation](06-customise) — adapting BibFlow to your institute and habits.
