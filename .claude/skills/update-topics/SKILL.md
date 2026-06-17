---
name: update-topics
description: Rebuild or extend the Topic MOCs in 1 Literature/Topics/ by synthesising the analysed per-paper literature notes. Use when the user says "update topics", or asks to refresh/rebuild the topic maps-of-content from the paper notes.
---

# Update Topics

Refresh the Topic MOCs in `1 Literature/Topics/` from the analysed per-paper
notes in `1 Literature/Paper Notes/`.

## What a Topic MOC is
A Map of Content that gathers the papers of one theme and synthesises **how they
relate** — not a flat list. One file per topic (`Topic - ….md`), tagged
`#topic/<slug>`; each paper self-classifies by carrying that tag in its note.

## Inputs
- Per-paper notes: `1 Literature/Paper Notes/*.md` — each has a summary / key
  findings and one or more `#topic/<slug>` tags.
- The existing Topic MOCs — **extend** the author's framing, don't discard it.

## Steps
1. **Collect** — for each topic, gather every paper note carrying its
   `#topic/<slug>` tag; also flag notes that clearly belong but lack the tag.
2. **Read the substance** — extract each paper's contribution *to that topic*
   (its model, method, finding), not a generic abstract paraphrase.
3. **Synthesise, don't list** — under `## Core papers`, one line per paper: its
   specific contribution **and** how it contrasts/agrees with the others
   (thesis↔antithesis, simplest↔fullest, benchmark, …).
4. **Writing hooks** — link each topic to the relevant draft sections in `3 Writing/`.
5. **Cross-link** — keep an `Adjacent topics:` line pointing at related MOCs.
6. **New topics** — if a cluster of papers fits no existing topic, propose a new
   `Topic - ….md` (ask before creating one).

## Rules
- Reference papers by wikilink (`[[citekey]]`), never by path.
- Never invent contributions — every claim traces to a paper note. If a note is
  thin, say so rather than embellish.
- Keep verbatim source quotes in their original language (see the vault `CLAUDE.md`).
- Preserve each Topic note's frontmatter `aliases`.
