<%*
// --------------------------------------------------------------------
// Set the reading-status tag on the active literature note.
//
// Opens a suggester with the canonical statuses, then writes the chosen
// tag between %% begin status %% / %% end status %% markers (the persist
// block defined in the Literature Note template). If the note doesn't
// have a status block yet, inserts one right after the [Open in Zotero]
// link.
//
// Bind a hotkey via Templater settings → Template Hotkeys for one-tap
// status changes while reading.
// --------------------------------------------------------------------

const file = tp.config.target_file || app.workspace.getActiveFile();
if (!file) {
  new Notice("Set Reading Status: no active file");
  return;
}

const STATUSES = [
  { tag: "#paper/to-read",     label: "To-read" },
  { tag: "#paper/fully-read",  label: "Fully read" },
  { tag: "#paper/referenced",  label: "Referenced (one aspect)" },
  { tag: "#paper/skimmed",     label: "Skimmed" },
];

const choice = await tp.system.suggester(
  (s) => s.label,
  STATUSES,
  false,
  "Reading status"
);
if (!choice) return;

let content = await app.vault.read(file);
const blockRe = /(%% begin status %%)[\s\S]*?(%% end status %%)/;

if (blockRe.test(content)) {
  content = content.replace(blockRe, `$1\n${choice.tag}\n$2`);
} else {
  // Fallback: insert a fresh **Status:** line + persist block right
  // after the "[Open in Zotero](...)" link (the last line of the
  // header metadata in the Literature Note template).
  const linkRe = /(\[Open in Zotero\]\([^)]+\))/;
  const m = content.match(linkRe);
  if (!m) {
    new Notice(
      "Set Reading Status: couldn't find [Open in Zotero] link to anchor on. Add a Status block manually."
    );
    return;
  }
  const insertAt = content.indexOf(m[0]) + m[0].length;
  const block =
    "\n\n**Status:**\n%% begin status %%\n" +
    choice.tag +
    "\n%% end status %%";
  content = content.slice(0, insertAt) + block + content.slice(insertAt);
}

await app.vault.modify(file, content);
new Notice(`Status: ${choice.label}`);
-%>
