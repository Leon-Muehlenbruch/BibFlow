---
title: Templater commands
parent: Using
nav_order: 2
---

# Templater commands

All actions reach you from one hotkey: **Option+T** (the Launcher).

## Launcher menu

```
─── Literature ───
Import Paper from Zotero
Fetch References for the current paper

Refresh All Literature
Refresh Paper Metrics
─── Search ───
Paper Search  (experimental)
```

## Per-paper actions

| Command                              | Effect                                                                                          |
|--------------------------------------|-------------------------------------------------------------------------------------------------|
| Import Paper from Zotero             | opens Zotero Integrations import modal                                                          |
| Fetch References for the current paper | reads the open notes DOI, queries OpenAlex, writes a list of cited works under `## Cited works` |

## Bulk actions

| Command               | Effect                                                                                       |
|-----------------------|----------------------------------------------------------------------------------------------|
| Refresh All Literature| re-imports every paper in `1 Literature/` from Zotero                                        |
| Refresh Paper Metrics | re-runs `0/fetch_metrics.py`; rewrites `0/Paper Metrics.md` with current OpenAlex citations  |

## Search

| Command      | Effect                                                                                              |
|--------------|-----------------------------------------------------------------------------------------------------|
| Paper Search | runs `0/fetch_search.py` against queries in `0/Paper Search.md`; writes ranked results into the note |

> **Experimental.** Paper Search is under active development and not yet thoroughly tested. The OpenAlex query layer, result format, and section markers may change without warning. Expect rough edges; report bugs by opening an issue on the [BibFlow repo](https://github.com/Leon-Muehlenbruch/BibFlow).

## Adding a new command

Edit `9 Orga/Templater/Launcher.md`. Add a row to the `items` array:

```js
{ kind: "template", label: "Your Action", path: "9 Orga/Templater/Your Action.md" }
```

Save. The new entry appears in the picker on the next Option+T.
