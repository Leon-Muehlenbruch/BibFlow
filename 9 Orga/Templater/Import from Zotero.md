<%*
// --------------------------------------------------------------------
// Trigger a Zotero Integration import command — equivalent to the
// default Cmd+Shift+I hotkey, but reachable via the Templater
// picker / your own hotkey binding.
//
// Detects every "Import"-named command registered by the Zotero
// Integration plugin. If there's only one (the usual case), it runs
// straight away. If you have multiple Import Formats configured in
// Settings → Zotero Integration, a chooser appears.
//
// Usage:
//   • Command palette: "Templater: Open Insert Template Modal"
//     → pick "Import from Zotero"
//   • Or bind a hotkey via Templater settings → Template Hotkeys.
// --------------------------------------------------------------------

const ZOTERO_PREFIX = "obsidian-zotero-desktop-connector:";

// --- clean up the throwaway trigger file Templater opens via hotkey ------
const triggerFile =
  tp.config.target_file || app.workspace.getActiveFile();
const triggerIsFresh =
  triggerFile ? (Date.now() - (triggerFile.stat?.ctime ?? 0)) < 10000 : false;

const cleanup = async () => {
  if (!triggerFile || !triggerIsFresh) return;
  try {
    app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view?.file?.path === triggerFile.path) leaf.detach();
    });
    await app.vault.delete(triggerFile);
  } catch (e) {
    console.warn("[zotero-import] cleanup failed:", e);
  }
};

// --- find the import command(s) registered by Zotero Integration --------
let zoteroCmds = Object.values(app.commands.commands).filter((c) =>
  c.id.startsWith(ZOTERO_PREFIX) &&
  (c.name || "").toLowerCase().includes("import")
);

// Fallback: if the name filter missed everything, show every Zotero cmd
if (zoteroCmds.length === 0) {
  zoteroCmds = Object.values(app.commands.commands).filter((c) =>
    c.id.startsWith(ZOTERO_PREFIX)
  );
}

if (zoteroCmds.length === 0) {
  new Notice("Zotero Integration plugin not found or not configured.");
  tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
  return;
}

// --- pick one --------------------------------------------------------------
let chosen;
if (zoteroCmds.length === 1) {
  chosen = zoteroCmds[0];
} else {
  chosen = await tp.system.suggester(
    (c) => c.name || c.id,
    zoteroCmds,
    false,
    "Pick a Zotero import format",
  );
  if (!chosen) {
    tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
    return;
  }
}

// --- run -------------------------------------------------------------------
console.log(`[zotero-import] executing: ${chosen.id} (${chosen.name})`);
new Notice(`Zotero: ${chosen.name || chosen.id}`);
app.commands.executeCommandById(chosen.id);

tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
-%>
