<%*
// --------------------------------------------------------------------
// Wrap parenthetical in-text citations in the active note as Obsidian
// wikilinks, so they resolve via the cited note's `aliases:` frontmatter.
// Idempotent — safe to re-run.
//
// Bind a hotkey via Templater settings → Template Hotkeys for one-tap
// linking after manual edits.
// --------------------------------------------------------------------

const file = tp.config.target_file || app.workspace.getActiveFile();
if (!file) {
  new Notice("Link In-Text Citations: no active file");
  return;
}

if (typeof tp.user.linkInTextCitations !== "function") {
  new Notice("linkInTextCitations user script not loaded — check Templater settings → User script files");
  return;
}

let changed;
try {
  changed = await tp.user.linkInTextCitations(file);
} catch (e) {
  console.error("[link-citations]", e);
  new Notice(`Link In-Text Citations failed: ${e.message}`);
  return;
}

new Notice(changed ? `Citations linked in ${file.basename}` : `No new citations to link in ${file.basename}`);
-%>
