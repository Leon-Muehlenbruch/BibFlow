<%*
// --------------------------------------------------------------------
// Promote the current editor selection into a concept note.
//
// Common case: you imported a paper into Obsidian, see a green-highlighted
// key term under "## Key terms", select the term, run this command.
//   1. Creates 2 Wiki/Concept Notes/<term>.md from the Concept Note template.
//   2. Replaces the selection with [[term]] so the literature note links
//      to the new concept.
//   3. If the concept note already exists, just inserts the wikilink —
//      never overwrites your existing notes.
//
// Bind via Templater settings → Template Hotkeys, or trigger via the
// Launcher menu (Option+T → Promote selection to concept note).
// --------------------------------------------------------------------

const TEMPLATE_PATH = "9 Orga/Templates/Concept Note.md";
const FOLDER        = "2 Wiki/Concept Notes";

const editor = app.workspace.activeEditor?.editor;
if (!editor) {
  new Notice("Open a note in the editor first.");
  return;
}
const raw = editor.getSelection();
if (!raw || !raw.trim()) {
  new Notice("Select a term first, then run this command.");
  return;
}

// Strip <mark> wrappers from imported Zotero highlights, plus surrounding
// punctuation/quotes/whitespace. Keeps inline emphasis-y selections clean.
const name = raw
  .replace(/<\/?mark[^>]*>/g, "")
  .replace(/^[\s"`*_~]+|[\s"`*_~]+$/g, "")
  .trim();

if (!/^[^/:\\?*<>|]+$/.test(name)) {
  new Notice(`"${name}" contains characters not allowed in filenames. Rename manually.`);
  return;
}

const path = `${FOLDER}/${name}.md`;
let target = app.vault.getAbstractFileByPath(path);

if (!target) {
  const tpl = app.vault.getAbstractFileByPath(TEMPLATE_PATH);
  let body  = tpl ? await app.vault.read(tpl) : `# ${name}\n`;
  body = body.replaceAll("{{title}}", name).replaceAll("{{name}}", name);
  if (!(await app.vault.adapter.exists(FOLDER))) {
    await app.vault.createFolder(FOLDER);
  }
  target = await app.vault.create(path, body);
  new Notice(`Created concept note: ${name}`);
} else {
  new Notice(`"${name}" already exists — linking to it.`);
}

// Replace the original selection (which may include <mark> tags etc.) with
// a clean [[wikilink]] using the cleaned name.
editor.replaceSelection(`[[${name}]]`);
-%>
