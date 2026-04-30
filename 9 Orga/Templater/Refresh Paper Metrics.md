<%*
// --------------------------------------------------------------------
// Refresh "0/Paper Metrics.md" by running the fetch_metrics.py script,
// which queries OpenAlex + Semantic Scholar for each paper in
// "1 Literature/" and writes a sortable markdown table.
//
// Usage:
//   • Command palette: "Templater: Open Insert Template Modal"
//     → pick "Refresh Paper Metrics"
//   • Or bind a hotkey via Templater settings → Template Hotkeys
//
// Requires: python3 available on $PATH (or at one of the fallback
// paths below). Script lives at 0/fetch_metrics.py.
// --------------------------------------------------------------------

const SCRIPT_PATH = "/Users/leon/Master Thesis/0/fetch_metrics.py";
const RESULT_PATH = "0/Paper Metrics.md";

// Obsidian launched from the Dock/Spotlight often has a minimal $PATH
// that misses Homebrew and /usr/local/bin. Try a few common python3
// locations in order and use the first one that exists.
const PYTHON_CANDIDATES = [
  "/opt/homebrew/bin/python3",   // Apple Silicon Homebrew
  "/usr/local/bin/python3",      // Intel Homebrew
  "/usr/bin/python3",            // system python
  "python3",                     // whatever's on $PATH
];

// --- grab the throwaway trigger file (same pattern as Refresh All Literature) ---
const triggerFile =
  tp.config.target_file || app.workspace.getActiveFile();
const triggerIsFresh =
  triggerFile ? (Date.now() - (triggerFile.stat?.ctime ?? 0)) < 10000 : false;

console.log(
  "[refresh-metrics] triggerFile:",
  triggerFile?.path,
  "fresh:",
  triggerIsFresh,
);

const cleanup = async () => {
  if (!triggerFile || !triggerIsFresh) {
    console.log("[refresh-metrics] cleanup skipped");
    return;
  }
  try {
    app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view?.file?.path === triggerFile.path) leaf.detach();
    });
    await app.vault.delete(triggerFile);
    console.log("[refresh-metrics] deleted", triggerFile.path);
  } catch (e) {
    console.warn("[refresh-metrics] cleanup failed:", e);
  }
};

// --- pick a working python3 ---
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");
const execp = util.promisify(exec);

let python = null;
for (const p of PYTHON_CANDIDATES) {
  if (p === "python3" || fs.existsSync(p)) {
    python = p;
    break;
  }
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

// --- run the script ---
new Notice("Refreshing paper metrics...");
console.log(`[refresh-metrics] running: ${python} "${SCRIPT_PATH}"`);

try {
  const { stdout, stderr } = await execp(
    `"${python}" "${SCRIPT_PATH}"`,
    { timeout: 180000, maxBuffer: 10 * 1024 * 1024 },
  );
  console.log("[refresh-metrics] stdout:\n" + stdout);
  if (stderr) console.warn("[refresh-metrics] stderr:\n" + stderr);

  // Pull the paper count out of the script's final line: "Wrote ... (N papers)"
  const m = stdout.match(/\((\d+)\s+papers?\)/);
  const n = m ? m[1] : "?";
  new Notice(`✓ Paper metrics refreshed (${n} papers).`);

  // Optional: open the result file. Comment out if you don't want this.
  const result = app.vault.getAbstractFileByPath(RESULT_PATH);
  if (result) await app.workspace.getLeaf(false).openFile(result);
} catch (e) {
  console.error("[refresh-metrics] failed:", e);
  new Notice(`Paper metrics refresh failed: ${e.message}`);
}

tp.hooks.on_all_templates_executed(async () => {
  await cleanup();
});
-%>
