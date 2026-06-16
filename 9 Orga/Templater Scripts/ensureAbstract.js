// Templater user function — ensures a literature note's `%% begin
// abstract %% / %% end abstract %%` persist block has content. If
// Zotero Integration's persist substitution leaves the block empty on a
// re-import (which happens because the template default is gated on
// `isFirstImport` to avoid the concatenation bug Zotero Integration has
// with non-empty defaults), this helper drops in a placeholder so the
// user always has somewhere to type.
//
// What it does, idempotently:
//   1. Find the abstract block.
//   2. If content between markers is empty (or whitespace-only), drop in
//      the placeholder.
//   3. If content is present, leave it alone.
//
// Returns true if the file was modified.

async function ensureAbstract(
  file,
  placeholder = "_No abstract in Zotero — replace this line with your own abstract; it survives re-imports._"
) {
  if (!file) return false;
  const original = await app.vault.read(file);
  const re = /(%% begin abstract %%)([\s\S]*?)(%% end abstract %%)/;
  const m = original.match(re);
  if (!m) return false;

  const inner = m[2];
  if (inner.trim()) return false; // has user content, don't touch

  const cleaned = `\n${placeholder}\n`;
  if (cleaned === inner) return false;
  const updated = original.replace(re, (_, a, _b, c) => `${a}${cleaned}${c}`);
  await app.vault.modify(file, updated);
  return true;
}

module.exports = ensureAbstract;
