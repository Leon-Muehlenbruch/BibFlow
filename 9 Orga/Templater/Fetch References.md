<%*
// --------------------------------------------------------------------
// Fetch the reference list of the currently open literature note and
// write it into that note's "## Cited works" persist block via
// fetch_references.py.
//
// Usage:
//   • Open a paper note in "1 Literature/"
//   • Command palette: "Templater: Open Insert Template Modal"
//     → pick "Fetch References"
//   • Or bind a hotkey via Templater settings → Template Hotkeys
//
// Requires: python3 on $PATH (or at one of the fallback paths below).
// Script lives at 0/fetch_references.py.
// --------------------------------------------------------------------

const SCRIPT_PATH = "/Users/leon/Master Thesis/0/fetch_references.py";
const LIT_FOLDER  = "1 Literature/";

const PYTHON_CANDIDATES = [
  "/opt/homebrew/bin/python3",   // Apple Silicon Homebrew
  "/usr/local/bin/python3",      // Intel Homebrew
  "/usr/bin/python3",            // system python
  "python3",                     // whatever's on $PATH
];

// --- figure out which file to run against ----------------------------------
// If Templater invoked this via a hotkey that created a throwaway file,
// tp.config.active_file is the note the user was actually on. Otherwise
// fall back to the workspace active file.
const activeFile =
  tp.config.active_file ||
  tp.config.target_file ||
  app.workspace.getActiveFile();

// And detect a fresh throwaway trigger file so we can clean it up.
const triggerFile =
  tp.config.target_file || app.workspace.getActiveFile();
const triggerIsFresh =
  triggerFile ? (Date.now() - (triggerFile.stat?.ctime ?? 0)) < 10000 : false;

console.log(
  "[fetch-refs] activeFile:",
  activeFile?.path,
  "triggerFile:",
  triggerFile?.path,
  "fresh:",
  triggerIsFresh,
);

const cleanup = async () => {
  if (!triggerFile || !triggerIsFresh) return;
  try {
    app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view?.file?.path === triggerFile.path) leaf.detach();
    });
    await app.vault.delete(triggerFile);
    console.log("[fetch-refs] deleted", triggerFile.path);
  } catch (e) {
    console.warn("[fetch-refs] cleanup failed:", e);
  }
};

// --- validate the target ---------------------------------------------------
if (!activeFile) {
  new Notice("No active file — open a paper note first.");
  tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
  return;
}
if (!activeFile.path.startsWith(LIT_FOLDER)) {
  new Notice(`"${activeFile.basename}" isn't in ${LIT_FOLDER}. Open a paper note first.`);
  tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
  return;
}

const citekey =
  app.metadataCache.getFileCache(activeFile)?.frontmatter?.citekey ||
  activeFile.basename;
if (!citekey) {
  new Notice("Couldn't find a citekey for this note.");
  tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
  return;
}

// --- find a python3 and the script ----------------------------------------
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

// --- run -------------------------------------------------------------------
new Notice(`Fetching references for ${citekey}...`);
console.log(`[fetch-refs] running: ${python} "${SCRIPT_PATH}" ${citekey}`);

try {
  const { stdout, stderr } = await execp(
    `"${python}" "${SCRIPT_PATH}" "${citekey}"`,
    { timeout: 300000, maxBuffer: 20 * 1024 * 1024 },
  );
  console.log("[fetch-refs] stdout:\n" + stdout);
  if (stderr) console.warn("[fetch-refs] stderr:\n" + stderr);

  // Parse "Resolved X/Y via OpenAlex" for a nicer notice.
  const m = stdout.match(/Resolved\s+(\d+)\/(\d+)/);
  const msg = m
    ? `✓ ${citekey}: ${m[1]}/${m[2]} references fetched`
    : `✓ ${citekey}: references updated`;
  new Notice(msg);
} catch (e) {
  console.error("[fetch-refs] failed:", e);
  new Notice(`Fetch references failed: ${e.message}`);
}

tp.hooks.on_all_templates_executed(async () => {
  await cleanup();
});
-%>
