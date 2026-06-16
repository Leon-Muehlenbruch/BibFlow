// Templater user function — segments the Highlights section by TOC chapter.
//
// Reads:
//   • the Table of contents block (between %% begin toc %% / %% end toc %%)
//     and parses top-level sections of the form "- Name — p. N"
//   • the ## Highlights section, with its three colour subsections
//     (### General / ### Key terms / ### Media)
//
// Walks each subsection's bullets in document order, finds which TOC
// section each bullet's page number falls into, and inserts a
// "#### <chapter> — p. <N>" heading at every chapter boundary. Idempotent —
// existing #### chapter headings are stripped before regrouping, so it
// can be re-run after every Zotero import without accumulating duplicates.
//
// Returns true if the file was modified, false otherwise.
//
// Usage from a Templater command:
//   <% await tp.user.groupHighlightsBySection(file) %>

async function groupHighlightsBySection(file) {
  if (!file) return false;
  const original = await app.vault.read(file);
  let content = original;

  // ----- 1. Parse top-level TOC entries ------------------------------------
  const tocMatch = content.match(/%% begin toc %%([\s\S]*?)%% end toc %%/);
  if (!tocMatch) return false;

  const sections = [];
  for (const line of tocMatch[1].split("\n")) {
    // Top-level only: leading "- ", no indent. Optionally followed by
    // an HTML comment "<!-- y=N -->" giving the chapter heading's
    // y-coordinate on the page (so we can place chapter boundaries
    // correctly when a page contains the end of one chapter and the
    // start of the next).
    const m = line.match(
      /^- (.+?) \u2014 p\. (\d+)\s*(?:<!--\s*y=([\d.]+)\s*-->)?\s*$/
    );
    if (m) {
      sections.push({
        name: m[1].trim(),
        page: parseInt(m[2], 10),
        y: m[3] != null ? parseFloat(m[3]) : null,
      });
    }
  }
  if (sections.length === 0) return false;

  // Map an annotation's (page, y) → the chapter it belongs to.
  // PDF coordinate convention: origin at bottom-left, Y increases
  // upward. So in reading order, larger Y = earlier on the page.
  // A chapter is "before" an annotation if it starts on an earlier
  // page, OR on the same page but at a higher (or equal) Y. When we
  // don't know the Y of either side, fall back to page-only logic.
  const sectionFor = (page, y) => {
    let current = null;
    for (const s of sections) {
      let beforeOrAt;
      if (s.page < page) {
        beforeOrAt = true;
      } else if (s.page === page) {
        beforeOrAt = s.y == null || y == null ? true : s.y >= y;
      } else {
        beforeOrAt = false;
      }
      if (beforeOrAt) current = s;
      else break;
    }
    return current;
  };

  // ----- 2. Re-group each colour subsection --------------------------------
  const SUBSECTIONS = ["General", "Key terms", "Media"];

  for (const sub of SUBSECTIONS) {
    const escaped = sub.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Capture: (1) the "### Sub" header line plus optional comment that
    // follows it, (2) the body up to the next ###/##/---/persist marker.
    const subRe = new RegExp(
      `(### ${escaped}\\s*\\n(?:<!--[\\s\\S]*?-->\\s*\\n)?)([\\s\\S]*?)(?=\\n### |\\n## |\\n---|\\n%% begin)`
    );
    const subMatch = content.match(subRe);
    if (!subMatch) continue;

    const header = subMatch[1];
    let body = subMatch[2];

    // Idempotent: strip any chapter headings we previously inserted.
    body = body.replace(/^#### .+? \u2014 p\. \d+\s*\n?/gm, "");
    body = body.replace(/\n{3,}/g, "\n\n");

    // Parse body into entries — one top-level "- " bullet plus any
    // following indented sub-bullets / continuation lines until the
    // next top-level bullet.
    const lines = body.split("\n");
    const entries = [];
    let cur = null;
    for (const line of lines) {
      if (/^- /.test(line)) {
        if (cur) entries.push(cur);
        cur = { lines: [line], page: null, y: null };
        // Visible "(p. N)" is the pageLabel — for journal articles this
        // is the journal-wide page number, which doesn't match the
        // article-relative pages used in the TOC. The hidden HTML
        // comment carries:
        //   p — the 1-based PDF page (matches the TOC), and
        //   y — the top-of-rect y-coordinate.
        // Prefer p= when present; fall back to the visible (p. N) for
        // older notes that haven't been re-imported yet.
        const pm = line.match(/\(p\. (\d+)\)\s*(?:<!--\s*([^>]+?)\s*-->)?/);
        if (pm) {
          let pdfPage = null;
          if (pm[2] != null) {
            const pMatch = pm[2].match(/\bp=(\d+)/);
            if (pMatch) pdfPage = parseInt(pMatch[1], 10);
            const yMatch = pm[2].match(/\by=([\d.]+)/);
            if (yMatch) cur.y = parseFloat(yMatch[1]);
          }
          cur.page = pdfPage != null ? pdfPage : parseInt(pm[1], 10);
        }
      } else if (cur) {
        cur.lines.push(line);
      }
      // Lines before the first bullet are dropped (typically empty).
    }
    if (cur) entries.push(cur);

    if (entries.length === 0) continue;

    // Walk entries in original order, emitting chapter headings at
    // each boundary.
    const out = [];
    let lastSection = null;
    for (const e of entries) {
      const sec = e.page != null ? sectionFor(e.page, e.y) : null;
      if (sec && sec !== lastSection) {
        if (out.length > 0) out.push("");
        out.push(`#### ${sec.name} \u2014 p. ${sec.page}`);
        out.push("");
        lastSection = sec;
      }
      // Trim trailing blank lines from each entry so consecutive
      // bullets stay tight; spacing is only added around chapter headings.
      while (e.lines.length && e.lines[e.lines.length - 1] === "") {
        e.lines.pop();
      }
      out.push(...e.lines);
    }

    let newBody = out.join("\n").replace(/\n{3,}/g, "\n\n");
    // Ensure exactly one trailing blank line before the next section
    newBody = newBody.replace(/\s*$/, "\n");
    content = content.replace(subRe, header + newBody);
  }

  if (content === original) return false;
  await app.vault.modify(file, content);
  return true;
}

module.exports = groupHighlightsBySection;
