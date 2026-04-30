<%*
// --------------------------------------------------------------------
// Show a quick summary of the vault's git state:
//   • whether auto-sync is on or off
//   • how many files have uncommitted changes
//   • current branch
//
// Usage:
//   • Via Launcher: pick "Show Git Status"
// --------------------------------------------------------------------

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
    console.warn("[git-status] cleanup failed:", e);
  }
};

const git = app.plugins.getPlugin("obsidian-git");
if (!git) {
  new Notice("Obsidian Git plugin not loaded.");
  tp.hooks.on_all_templates_executed(async () => { await cleanup(); });
  return;
}

const interval = git.settings.autoSaveInterval ?? 0;
const autoState = interval > 0 ? `ON (every ${interval} min)` : "OFF";

let changedCount = "?";
let branch = "?";

try {
  // gitManager is the abstraction layer (works for both isomorphic-git and simple-git modes).
  const status = await git.gitManager.status();
  changedCount = status.changed?.length ?? status.staged?.length ?? "?";
  branch = await git.gitManager.branchInfo?.().then(b => b.current) ?? "?";
} catch (e) {
  console.warn("[git-status] status fetch failed:", e);
}

new Notice(
  `Git Status\n` +
  `Auto-sync: ${autoState}\n` +
  `Branch: ${branch}\n` +
  `Changed files: ${changedCount}`,
  8000
);

console.log("[git-status]", { autoState, branch, changedCount });

tp.hooks.on_all_templates_executed(async () => {
  await cleanup();
});
-%>
