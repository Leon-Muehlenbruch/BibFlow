<%*
// --------------------------------------------------------------------
// Refresh every literature note in "1 Literature/" by re-running
// Zotero Integration's import for each paper's citekey.
//
// Usage:
//   • Command palette: "Templater: Open Insert Template Modal"
//     → pick "Refresh All Literature"
//   • Or bind a hotkey via Templater settings → Template Hotkeys
//
// Requires: Templater plugin + Zotero Integration plugin installed.
// --------------------------------------------------------------------

// The throwaway file Templater created for this invocation.
// We delete it at the end so the hotkey doesn't clutter the vault.
// Grab the active file NOW, before any runImport call changes which file is active.
const triggerFile =
  tp.config.target_file || app.workspace.getActiveFile();
// If this file was created within the last 10 seconds, treat it as the
// throwaway Template Hotkey file. Otherwise it's a real note — leave it alone.
const triggerIsFresh =
  triggerFile ? (Date.now() - (triggerFile.stat?.ctime ?? 0)) < 10000 : false;

console.log(
  "[refresh-all] triggerFile:",
  triggerFile?.path,
  "ctime:",
  triggerFile?.stat?.ctime,
  "fresh:",
  triggerIsFresh
);

const cleanup = async () => {
  if (!triggerFile) {
    console.log("[refresh-all] cleanup skipped: no triggerFile");
    return;
  }
  if (!triggerIsFresh) {
    console.log("[refresh-all] cleanup skipped: triggerFile is not fresh");
    return;
  }
  try {
    app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view?.file?.path === triggerFile.path) leaf.detach();
    });
    await app.vault.delete(triggerFile);
    console.log("[refresh-all] deleted", triggerFile.path);
  } catch (e) {
    console.warn("[refresh-all] cleanup failed:", e);
  }
};

const plugin = app.plugins.getPlugin("obsidian-zotero-desktop-connector");
if (!plugin) {
  new Notice("Zotero Integration plugin not loaded.");
  tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
  return;
}

// Pick the first configured import format. If you have more than one
// and want a specific one, replace this with: const IMPORT_NAME = "Literature";
const formats = plugin.settings.exportFormats || [];
if (formats.length === 0) {
  new Notice("No Zotero Integration import formats configured.");
  tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
  return;
}
const IMPORT_NAME = formats[0].name;

// Folder where your literature notes live.
const LITERATURE_FOLDER = "1 Literature/";

// Collect every .md file in that folder and pull out its citekey.
const files = app.vault
  .getMarkdownFiles()
  .filter((f) => f.path.startsWith(LITERATURE_FOLDER));

const targets = [];
for (const file of files) {
  const citekey = app.metadataCache.getFileCache(file)?.frontmatter?.citekey;
  if (citekey) targets.push({ file, citekey });
}

if (targets.length === 0) {
  new Notice("No literature notes with a citekey found.");
  tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
  return;
}

new Notice(`Refreshing ${targets.length} papers via "${IMPORT_NAME}"...`);
console.log(`[refresh-all] starting for ${targets.length} papers`);

let ok = 0;
let fail = 0;
for (const { file, citekey } of targets) {
  try {
    await plugin.runImport(IMPORT_NAME, citekey, 1);
    console.log(`[refresh-all] ✓ ${citekey}`);
    ok++;
  } catch (e) {
    console.error(`[refresh-all] ✗ ${citekey}:`, e);
    fail++;
  }
}

new Notice(`Done. Refreshed ${ok}, failed ${fail}.`);
console.log(`[refresh-all] done: ${ok} ok, ${fail} fail`);

// Run cleanup AFTER Templater has finished writing to the file —
// otherwise Templater re-creates the file right after we delete it.
tp.hooks.on_all_templates_executed(async () => {
  await cleanup();
});
-%>
