<%*
// --------------------------------------------------------------------
// Commit override — deliberately bypass the pre-commit deletion guard
// and commit with `git commit --no-verify`.
//
// Use ONLY after you've reviewed the staged deletions (the guard fires
// at ≥10 staged deletions). This is the manual override.
//
// Usage:
//   • Via Launcher (Cmd+T): pick "Commit override …"
// --------------------------------------------------------------------

// Cleanup the throwaway trigger file FIRST, so `git add -A` in the user
// script can't sweep it into the commit (same pattern as Commit and Sync Now).
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
    console.warn("[no-verify] cleanup failed:", e);
  }
};
await cleanup();

// Explicit confirmation — this skips a safety hook on purpose.
const choice = await tp.system.suggester(
  ["✋  Cancel", "⚠️  Commit anyway — bypass deletion guard (--no-verify)"],
  ["cancel", "go"],
  false,
  "Override the pre-commit deletion guard?",
);

if (choice !== "go") {
  new Notice("Override cancelled.");
  return;
}

await tp.user.gitCommitNoVerify(tp);
-%>
