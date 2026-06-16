<%*
// --------------------------------------------------------------------
// Refresh the "Table of contents" block in the active literature note.
//
// Reads `citekey` from frontmatter, calls tp.user.extractPdfToc, and
// writes the result between %% begin toc %% / %% end toc %% markers.
// If those markers don't exist yet, inserts a new "## Table of contents"
// section above "## Highlights" (or appends it to the file as a fallback).
//
// Re-runnable: a second run replaces the existing block.
//
// Bind a hotkey to this command via Templater settings → Template Hotkeys.
// --------------------------------------------------------------------

const file = tp.config.target_file || app.workspace.getActiveFile();
if (!file) {
  new Notice("Refresh TOC: no active file");
  return;
}

const cache = app.metadataCache.getFileCache(file);
const citekey = cache?.frontmatter?.citekey;
if (!citekey) {
  new Notice("Refresh TOC: no citekey in frontmatter");
  return;
}

new Notice(`Refreshing TOC for ${citekey}…`);

let toc;
try {
  toc = await tp.user.extractPdfToc(citekey);
} catch (e) {
  console.error("[refresh-toc]", e);
  new Notice(`Refresh TOC failed: ${e.message}`);
  return;
}
if (!toc) toc = "<!-- TOC: empty result -->";

let content = await app.vault.read(file);

const blockRe = /(%% begin toc %%)[\s\S]*?(%% end toc %%)/;
if (blockRe.test(content)) {
  content = content.replace(blockRe, `$1\n${toc}\n$2`);
} else {
  // Insert a fresh section above "## Highlights" (your import template's
  // next section), or append to the end if Highlights isn't present.
  const block =
    "\n---\n## Table of contents\n" +
    "<!-- extracted from the PDF bookmarks; refresh with the \"Refresh TOC\" command -->\n" +
    "%% begin toc %%\n" +
    toc +
    "\n%% end toc %%\n";

  const idx = content.indexOf("## Highlights");
  if (idx > -1) {
    // Place block before the "---" separator that precedes "## Highlights"
    const sepIdx = content.lastIndexOf("---", idx);
    const insertAt = sepIdx > -1 ? sepIdx : idx;
    content = content.slice(0, insertAt) + block + "\n" + content.slice(insertAt);
  } else {
    content = content.trimEnd() + "\n" + block + "\n";
  }
}

await app.vault.modify(file, content);
new Notice(`TOC refreshed (${citekey})`);
-%>
