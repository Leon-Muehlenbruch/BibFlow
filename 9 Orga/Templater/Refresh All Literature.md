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

// Helper: re-extract the PDF TOC for one note and write it between
// %% begin toc %% / %% end toc %% markers. No-op if the markers don't
// exist (e.g. the Literature Note template hasn't been updated yet).
const refreshToc = async (file, citekey) => {
  if (typeof tp.user.extractPdfToc !== "function") return false;
  let toc;
  try {
    toc = await tp.user.extractPdfToc(citekey);
  } catch (e) {
    console.error(`[refresh-all] toc extract failed for ${citekey}:`, e);
    return false;
  }
  if (!toc) return false;
  const content = await app.vault.read(file);
  const re = /(%% begin toc %%)[\s\S]*?(%% end toc %%)/;
  if (!re.test(content)) return false;
  const next = content.replace(re, `$1\n${toc}\n$2`);
  if (next !== content) await app.vault.modify(file, next);
  return true;
};

// Helper: regroup the Highlights subsections by TOC chapter. No-op if
// the user script isn't loaded yet (Templater hasn't picked up the
// scripts folder) or if the file lacks a TOC block.
const groupHighlights = async (file) => {
  if (typeof tp.user.groupHighlightsBySection !== "function") return false;
  try {
    return await tp.user.groupHighlightsBySection(file);
  } catch (e) {
    console.error(`[refresh-all] grouping failed for ${file.path}:`, e);
    return false;
  }
};

// Helper: wrap parenthetical in-text citations as Obsidian wikilinks so
// they resolve via the cited note's `aliases` frontmatter. No-op if the
// user script isn't loaded.
const linkCitations = async (file) => {
  if (typeof tp.user.linkInTextCitations !== "function") return false;
  try {
    return await tp.user.linkInTextCitations(file);
  } catch (e) {
    console.error(`[refresh-all] citation linking failed for ${file.path}:`, e);
    return false;
  }
};

// Helper: repair the status persist block — fill empty blocks with the
// default tag, dedupe accumulated duplicates from earlier broken
// behaviour. Idempotent.
const fixStatus = async (file) => {
  if (typeof tp.user.ensureStatusDefault !== "function") return false;
  try {
    return await tp.user.ensureStatusDefault(file);
  } catch (e) {
    console.error(`[refresh-all] status repair failed for ${file.path}:`, e);
    return false;
  }
};

// Helper: repair the abstract persist block — fill empty blocks with a
// placeholder so the user always has somewhere to type. Idempotent.
const fixAbstract = async (file) => {
  if (typeof tp.user.ensureAbstract !== "function") return false;
  try {
    return await tp.user.ensureAbstract(file);
  } catch (e) {
    console.error(`[refresh-all] abstract repair failed for ${file.path}:`, e);
    return false;
  }
};

let ok = 0;
let fail = 0;
let tocOk = 0;
let groupedOk = 0;
let linkedOk = 0;
let statusOk = 0;
let abstractOk = 0;
for (const { file, citekey } of targets) {
  try {
    await plugin.runImport(IMPORT_NAME, citekey, 1);
    console.log(`[refresh-all] ✓ ${citekey}`);
    ok++;
    if (await fixStatus(file)) statusOk++;
    if (await fixAbstract(file)) abstractOk++;
    if (await refreshToc(file, citekey)) tocOk++;
    if (await groupHighlights(file)) groupedOk++;
    if (await linkCitations(file)) linkedOk++;
  } catch (e) {
    console.error(`[refresh-all] ✗ ${citekey}:`, e);
    fail++;
  }
}

new Notice(`Done. Refreshed ${ok}, failed ${fail}, status ${statusOk}, abstract ${abstractOk}, TOCs ${tocOk}, grouped ${groupedOk}, linked ${linkedOk}.`);
console.log(`[refresh-all] done: ${ok} ok, ${fail} fail, ${statusOk} status, ${abstractOk} abstract, ${tocOk} TOCs, ${groupedOk} grouped, ${linkedOk} linked`);

// Run cleanup AFTER Templater has finished writing to the file —
// otherwise Templater re-creates the file right after we delete it.
tp.hooks.on_all_templates_executed(async () => {
  await cleanup();
});
-%>
