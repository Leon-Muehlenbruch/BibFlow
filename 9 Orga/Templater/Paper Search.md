<%*
// --------------------------------------------------------------------
// Run 0 Meta/Library/fetch_search.py — refreshes every `%% results-begin: ... %%`
// block in 0 Meta/Library/Paper Search.md based on the `\`\`\`search` fences above
// them. After the script finishes, opens the search note in the active
// pane.
//
// Usage:
//   • Command palette: "Templater: Open Insert Template Modal"
//     → pick "Paper Search"
//   • Or bind a hotkey via Templater settings → Template Hotkeys.
//
// Requires: python3 on $PATH (or at one of the fallback paths below).
// Script lives at 0 Meta/Library/fetch_search.py.
// --------------------------------------------------------------------

const SCRIPT_PATH = `${app.vault.adapter.basePath}/0 Meta/Library/fetch_search.py`;
const NOTE_PATH   = "0 Meta/Library/Paper Search.md";

const PYTHON_CANDIDATES = [
  "/opt/homebrew/bin/python3",   // Apple Silicon Homebrew
  "/usr/local/bin/python3",      // Intel Homebrew
  "/usr/bin/python3",            // system python
  "python3",                     // whatever's on $PATH
];

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
    console.warn("[paper-search] cleanup failed:", e);
  }
};

// --- find python + script -------------------------------------------------
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");
const execp = util.promisify(exec);

let python = null;
for (const p of PYTHON_CANDIDATES) {
  if (p === "python3" || fs.existsSync(p)) { python = p; break; }
}
if (!python) {
  new Notice("No python3 found. Install Python or edit PYTHON_CANDIDATES.");
  tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
  return;
}
if (!fs.existsSync(SCRIPT_PATH)) {
  new Notice(`Script missing: ${SCRIPT_PATH}`);
  tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
  return;
}

// --- run ------------------------------------------------------------------
new Notice("Running Paper Search…");
console.log(`[paper-search] running: ${python} "${SCRIPT_PATH}"`);

try {
  const { stdout, stderr } = await execp(
    `"${python}" "${SCRIPT_PATH}"`,
    { timeout: 300000, maxBuffer: 20 * 1024 * 1024 },
  );
  console.log("[paper-search] stdout:\n" + stdout);
  if (stderr) console.warn("[paper-search] stderr:\n" + stderr);

  // Parse "Found N search section(s)" and total results for a nicer notice.
  const m = stdout.match(/Found\s+(\d+)\s+search section/);
  new Notice(m ? `Paper Search: refreshed ${m[1]} section(s)` : "Paper Search: done");
} catch (e) {
  console.error("[paper-search] failed:", e);
  new Notice(`Paper Search failed: ${e.message}`);
}

// Open (or focus) Paper Search.md in the current leaf.
try {
  const target = app.vault.getAbstractFileByPath(NOTE_PATH);
  if (target) await app.workspace.getLeaf().openFile(target);
} catch (e) {
  console.warn("[paper-search] open failed:", e);
}

tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
-%>
