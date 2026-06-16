// Templater user function — wraps in-text citations in a literature note
// body as Obsidian wikilinks so they resolve via the cited note's
// `aliases:` frontmatter (set up by the Literature Note template). When
// the cited paper hasn't been imported yet, the link is unresolved but
// auto-connects the moment the user creates that note via Zotero import.
//
// Handles parenthetical citations only (the common case in Zhang-style
// reviews). Inline forms like "Smith et al. (2023)" are left alone.
//
//   (Smith 2023)            → ([[Smith 2023]])
//   (Smith, 2023)           → ([[Smith, 2023]])
//   (Smith et al. 2023)     → ([[Smith et al. 2023]])
//   (Smith and Jones 2023)  → ([[Smith and Jones 2023]])
//   (Smith & Jones 2023)    → ([[Smith & Jones 2023]])
//   (Smith 2023a)           → ([[Smith 2023a]])
//   (Smith 2010, 2011)      → ([[Smith 2010]], [[Smith 2011]])
//   (Smith 2010; Jones 2011)→ ([[Smith 2010]]; [[Jones 2011]])
//
// Skips:
//   • YAML frontmatter
//   • fenced code blocks (```...```)
//   • inline code (`...`)
//   • content already inside a [[ wikilink ]]
//
// Idempotent: re-runs are no-ops because already-linked text is protected.

async function linkInTextCitations(file) {
  if (!file) return false;
  const original = await app.vault.read(file);

  // ----- 1. Protect regions we must not touch ----------------------------
  // Replace each protected region with a placeholder \u0000<idx>\u0000 so
  // it survives the citation regex pass, then restore at the end.
  const SENTINELS = [];
  const stash = (s) => {
    const idx = SENTINELS.length;
    SENTINELS.push(s);
    return `\u0000${idx}\u0000`;
  };

  let work = original;

  // YAML frontmatter (must be at the very start)
  work = work.replace(/^---\n[\s\S]*?\n---\n/, (m) => stash(m));
  // Fenced code blocks
  work = work.replace(/```[\s\S]*?```/g, (m) => stash(m));
  // Inline code
  work = work.replace(/`[^`\n]+`/g, (m) => stash(m));
  // Existing wikilinks (with their full content)
  work = work.replace(/\[\[[^\[\]]*?\]\]/g, (m) => stash(m));

  // ----- 2. Wrap citations -----------------------------------------------
  work = work.replace(/\(([^()]+)\)/g, (whole, inner) => {
    // Multiple comma- or semicolon-separated citations share a paren.
    // Split on ; first; each piece may itself be a single citation.
    const parts = inner.split(/\s*;\s*/);
    let touched = false;
    const out = parts.map((part) => {
      const wrapped = wrapOneCitation(part);
      if (wrapped !== part) touched = true;
      return wrapped;
    });
    if (!touched) return whole;
    return `(${out.join("; ")})`;
  });

  // ----- 3. Restore protected regions ------------------------------------
  work = work.replace(/\u0000(\d+)\u0000/g, (_, i) => SENTINELS[parseInt(i, 10)]);

  if (work === original) return false;
  await app.vault.modify(file, work);
  return true;
}

function wrapOneCitation(part) {
  const raw = part.trim();
  if (!raw) return part;

  // AUTHOR_GROUP YEAR_LIST
  // YEAR_LIST: 4-digit year + optional letter suffix, possibly comma-
  // separated multi-years for the same author group.
  // Author/year separator may be a comma or just whitespace.
  const m = raw.match(
    /^(.+?)(,?)\s+((\d{4}[a-z]?)(?:\s*,\s*\d{4}[a-z]?)*)\s*$/u
  );
  if (!m) return part;
  const [, authors, comma, years] = m;

  // Sanity: authors must contain at least one capitalised word, must not
  // be entirely lower-case, and must look like names (no markup chars).
  if (!/\p{Lu}/u.test(authors)) return part;
  if (/[<>{}|@#$%]/.test(authors)) return part;
  // Reject obvious non-citation patterns (pure-prose stuff that happens
  // to end with a year — e.g. "in 2010", "since 2010", "the 2010 study").
  if (/^(in|since|by|after|before|until|the|a|an|on|at|of|for|to|from|during|throughout|circa|c\.|approx\.|approximately)\s+/i.test(authors)) {
    return part;
  }

  // Single year vs. multi-year for same author group.
  const yearList = years.split(/\s*,\s*/);
  const sep = comma ? "," : "";
  if (yearList.length === 1) {
    return `[[${authors.trim()}${sep} ${yearList[0]}]]`;
  }
  return yearList
    .map((y) => `[[${authors.trim()}${sep} ${y}]]`)
    .join(", ");
}

module.exports = linkInTextCitations;
