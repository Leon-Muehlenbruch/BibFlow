<%*
// --------------------------------------------------------------------
// Convert the current paper's PDF into a searchable Markdown file under
// "1 Literature/Full Text/<citekey> (full text).md", then open it.
//
// With many papers imported, the full text as plain Markdown lets you
// Cmd+F across the vault to find exactly which paper a quote came from.
//
// Reads `citekey` from the active literature note's frontmatter and calls
// tp.user.pdfToMarkdown, which shells out to pdf_to_markdown.py (pymupdf4llm).
// Re-running overwrites the file.
//
// Requires the Templater Scripts venv with pymupdf4llm — see
// "9 Orga/Templater Scripts/README.md". Bind a hotkey via Templater
// settings → Template Hotkeys, or run it from the Launcher.
// --------------------------------------------------------------------

const file = tp.config.target_file || app.workspace.getActiveFile();
if (!file) {
  new Notice("Convert to Markdown: no active file");
  return;
}

const LIT_FOLDER = "1 Literature/";
if (!file.path.startsWith(LIT_FOLDER)) {
  new Notice(`"${file.basename}" isn't in ${LIT_FOLDER}. Open a paper note first.`);
  return;
}

const citekey =
  app.metadataCache.getFileCache(file)?.frontmatter?.citekey || file.basename;
if (!citekey) {
  new Notice("Convert to Markdown: no citekey in frontmatter");
  return;
}

if (typeof tp.user.pdfToMarkdown !== "function") {
  new Notice(
    "pdfToMarkdown user script not loaded — check Templater settings → User script files"
  );
  return;
}

new Notice(`Converting ${citekey} to Markdown…`);

let rel;
try {
  rel = await tp.user.pdfToMarkdown(citekey);
} catch (e) {
  console.error("[convert-md]", e);
  new Notice(`Convert to Markdown failed: ${e.message}`);
  return;
}
if (!rel) return; // the helper already showed a notice on failure

// The file was written by an external process — wait briefly for Obsidian
// to index it, then open it in a new tab.
let target = null;
for (let i = 0; i < 20 && !target; i++) {
  target = app.vault.getAbstractFileByPath(rel);
  if (!target) await new Promise((r) => setTimeout(r, 100));
}

if (target) {
  await app.workspace.getLeaf("tab").openFile(target);
  new Notice(`✓ Full text: ${target.basename}`);
} else {
  new Notice(`Converted to ${rel} — open it from the file list.`);
}
-%>
