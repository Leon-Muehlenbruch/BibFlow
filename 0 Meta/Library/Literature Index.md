```dataviewjs
// Sort by first author's surname, then year.
const surname = (p) => {
  const first = p.authors?.[0];
  if (!first) return p.citekey ?? "";
  return String(first).trim().split(/\s+/).pop().toLowerCase();
};

const papers = dv.pages('"1 Literature"')
  .where((p) => p.citekey)
  .sort((p) => surname(p) + " " + (p.year ?? ""));

dv.table(
  ["In-line", "Note", "Name of publication"],
  papers.map((p) => [p.intext ?? "", p.file.link, p.title ?? ""])
);
```
## Recently edited notes
```dataview
LIST file.mtime
FROM "1 Literature"
SORT file.mtime DESC
LIMIT 10
```
## Most Cited Authors
```dataviewjs
const counts = {};
for (const p of dv.pages('"1 Literature"')) {
  if (!p.authors) continue;
  for (const a of p.authors) counts[a] = (counts[a] || 0) + 1;
}
const rows = Object.entries(counts).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
dv.table(["Author", "Papers"], rows);
```

## Literature sorted by year
```dataview
TABLE length(rows) AS "Papers", rows.file.link AS "Notes"
FROM "1 Literature"
GROUP BY year
SORT year DESC
```