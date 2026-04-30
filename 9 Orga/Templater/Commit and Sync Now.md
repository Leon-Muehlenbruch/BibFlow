<%*
// --------------------------------------------------------------------
// Trigger an immediate commit-and-sync via the Obsidian Git plugin.
// Equivalent to running "Git: Commit-and-sync" from the command palette.
//
// Usage:
//   • Via Launcher: pick "Commit and Sync Now"
//   • Or bind a hotkey via Templater settings → Template Hotkeys
// --------------------------------------------------------------------

const triggerFile =
  tp.config.target_file || app.workspace.getActiveFile();
const triggerIsFresh =
  triggerFile ? (Date.now() - (triggerFile.stat?.ctime ?? 0)) < 10000 : false;

console.log(
  "[commit-sync] triggerFile:",
  triggerFile?.path,
  "fresh:",
  triggerIsFresh
);

const cleanup = async () => {
  if (!triggerFile || !triggerIsFresh) return;
  try {
    app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view?.file?.path === triggerFile.path) leaf.detach();
    });
    await app.vault.delete(triggerFile);
    console.log("[commit-sync] deleted", triggerFile.path);
  } catch (e) {
    console.warn("[commit-sync] cleanup failed:", e);
  }
};

// Cleanup MUST happen before the commit runs — otherwise the throwaway
// file gets included in the commit. So we clean up first, then trigger.
await cleanup();

// Use the public command rather than poking at internals — most stable.
// Command IDs differ across plugin versions; try the modern one first.
const commandIds = [
  "obsidian-git:commit-and-sync",
  "obsidian-git:push", // older fallback
];

let executed = false;
for (const id of commandIds) {
  if (app.commands.commands[id]) {
    app.commands.executeCommandById(id);
    console.log(`[commit-sync] executed: ${id}`);
    executed = true;
    break;
  }
}

if (!executed) {
  new Notice("Could not find Git commit-and-sync command.");
  console.error("[commit-sync] no matching command id found");
}
-%>
