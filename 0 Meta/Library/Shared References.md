Not yet imported references, referenced by more than one paper under "1 Literature".
```dataviewjs
const pages = dv.pages('"1 Literature/Paper Notes"');

const counts = {};       // citekey -> count
const sources = {};      // citekey -> [source file links]
const displays = {};     // citekey -> pretty "Author, Year" alias

for (const p of pages) {
  // Raw file contents so we can grab both the citekey and the alias
  // inside every [[target|alias]] link.
  let content = await dv.io.load(p.file.path);
  // Strip HTML comments so placeholder links inside the Literature Note
  // template (e.g. `<!-- link [[other-citekey]] -->`) don't get counted.
  content = content.replace(/<!--[\s\S]*?-->/g, "");
  const linkRe = /\[\[([^|\]\n]+?)(?:\|([^\]\n]+))?\]\]/g;
  let m;
  while ((m = linkRe.exec(content)) !== null) {
    const target = m[1].trim();
    const alias  = (m[2] || target).trim();

    // Skip links that resolve to an existing note — those aren't "missing".
    if (dv.page(target)) continue;

    counts[target]  = (counts[target] || 0) + 1;
    sources[target] = sources[target] || [];
    sources[target].push(p.file.link);
    displays[target] = alias;
  }
}

const rows = Object.entries(counts)
  .filter(([, n]) => n > 1)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([target, n]) => [
    displays[target] || target,
    dv.fileLink(target),   // clickable — click to create the note if missing
    n,
    sources[target],
  ]);

if (rows.length === 0) {
  dv.paragraph("*No shared references yet — every unresolved link appears in only one of your notes.*");
} else {
  dv.table(
    ["Reference", "Citekey", "Cited by", "Sources"],
    rows,
  );
}
```
