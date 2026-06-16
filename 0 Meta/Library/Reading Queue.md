# Reading Queue

Every paper in `1 Literature/`, grouped by its reading status. Set a paper's
status with the **Set Reading Status** Templater command (or the Launcher →
*Set Reading Status*), which writes one of these tags into the note:

- `#paper/to-read` — in the library, not read yet
- `#paper/skimmed` — abstract + TOC + annotations skimmed
- `#paper/referenced` — read for one specific aspect, not cover-to-cover
- `#paper/fully-read` — read and synthesised

Papers without any status tag show up under **Unset** so nothing slips through.

```dataviewjs
// Canonical statuses, in the order a paper usually moves through them.
const STATUSES = [
  { tag: "paper/to-read",    label: "📥 To read" },
  { tag: "paper/skimmed",    label: "👀 Skimmed" },
  { tag: "paper/referenced", label: "🔖 Referenced (one aspect)" },
  { tag: "paper/fully-read", label: "✅ Fully read" },
];

const papers = dv.pages('"1 Literature"').where((p) => p.citekey);

// Bucket each paper by the first status tag it carries. `file.etags`
// holds the tags exactly as written (e.g. "#paper/to-read"), unlike
// `file.tags` which also expands parent components like "#paper".
const buckets = new Map(STATUSES.map((s) => [s.tag, []]));
const unset = [];
for (const p of papers) {
  const tags = (p.file.etags ?? []).map((t) => t.replace(/^#/, ""));
  const hit = STATUSES.find((s) => tags.includes(s.tag));
  if (hit) buckets.get(hit.tag).push(p);
  else unset.push(p);
}

// Summary line across the top.
dv.paragraph(
  STATUSES.map((s) => `**${s.label}:** ${buckets.get(s.tag).length}`).join(" · ") +
    ` · **Unset:** ${unset.length}`
);

const intext = (p) => p.intext ?? p.citekey ?? p.file.name;
const render = (label, rows) => {
  if (rows.length === 0) return;
  dv.header(3, `${label} (${rows.length})`);
  dv.table(
    ["Paper", "Title", "Year"],
    rows.sort((p) => intext(p)).map((p) => [p.file.link, p.title ?? "", p.year ?? ""])
  );
};

for (const s of STATUSES) render(s.label, buckets.get(s.tag));
render("❓ Unset", unset);
```
