<%*
// --------------------------------------------------------------------
// Launcher — categorised picker for every action Templater template.
//
// Bind one hotkey to this file (Settings → Templater → Template
// Hotkeys) and all your other Templater actions become reachable from
// it. Separator rows visually divide sections but have no effect when
// selected (the code no-ops on them).
//
// To add a new template to the picker, append a row to the `items`
// array below. Keep paths relative to the vault root.
// --------------------------------------------------------------------

const items = [
  { kind: "sep",      label: "─── Literature ───" },
  // Per-paper actions: run these on one specific paper note at a time.
  { kind: "template", label: "Import Paper from Zotero",              path: "9 Orga/Templater/Import from Zotero.md" },
  { kind: "template", label: "Fetch References for the current paper", path: "9 Orga/Templater/Fetch References.md" },
  { kind: "template", label: "Promote selection to concept note",         path: "9 Orga/Templater/Promote Selection to Concept.md" },
  // Blank spacer — marks the jump from per-paper actions to bulk actions.
  { kind: "sep",      label: " " },
  // Bulk actions: run across your whole library at once.
  { kind: "template", label: "Refresh All Literature",                 path: "9 Orga/Templater/Refresh All Literature.md" },
  { kind: "template", label: "Refresh Paper Metrics",                  path: "9 Orga/Templater/Refresh Paper Metrics.md" },

  { kind: "sep",      label: "─── Search ───" },
  { kind: "template", label: "Paper Search",                           path: "9 Orga/Templater/Paper Search.md" },

  { kind: "sep",      label: "─── Git ───" },
  { kind: "template", label: "Commit and Sync Now",                    path: "9 Orga/Templater/Commit and Sync Now.md" },
  { kind: "template", label: "Show Git Status",                        path: "9 Orga/Templater/Show Git Status.md" },
];

// --- show the picker ------------------------------------------------------
const chosen = await tp.system.suggester(
  (i) => i.label,
  items,
  false,
  "Pick a Templater action",
);

if (!chosen || chosen.kind !== "template") {
  // User cancelled, or clicked a separator — nothing to do.
  return;
}

// --- run the chosen template ---------------------------------------------
const target = app.vault.getAbstractFileByPath(chosen.path);
if (!target) {
  new Notice(`Template missing: ${chosen.path}`);
  return;
}

try {
  // tp.file.include runs the target template in this same context.
  // Action templates (starting with `<%*`) execute for their side effects
  // — running Python, triggering commands, etc. — and output nothing.
  await tp.file.include(target);
} catch (e) {
  console.error("[launcher] include failed:", e);
  new Notice(`Failed to run ${chosen.label}: ${e.message}`);
}
-%>
