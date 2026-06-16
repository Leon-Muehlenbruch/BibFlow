// Templater user function — repairs the `%% begin status %% / %% end status %%`
// persist block in a literature note so it always contains a clean,
// single-line, deduped list of reading-status tags.
//
// Why this exists:
//   • The Literature Note template gates its #paper/to-read default on
//     `isFirstImport` (mirroring the summary/findings style). That
//     prevents Zotero Integration's persist substitution from
//     concatenating the template default with already-preserved content
//     on every re-import (the cause of the previous double-tag bug).
//   • Side-effect: on a re-import where the existing note has *no*
//     status block yet, the template emits empty `%% begin %% %% end %%`
//     markers — we want #paper/to-read to land there.
//   • Side-effect: notes that already accumulated duplicate tags from
//     earlier broken behaviour need a one-shot clean-up.
//
// What it does, idempotently:
//   1. Find the status block.
//   2. Extract every hashtag inside it (any #foo/bar style, not just
//      #paper/...).
//   3. Dedupe in document order.
//   4. If the resulting list is empty, default to `#paper/to-read`.
//   5. Rewrite the block as a clean three-line layout.
//
// Returns true if the file was modified.

async function ensureStatusDefault(file, defaultTag = "#paper/to-read") {
  if (!file) return false;
  const original = await app.vault.read(file);
  const re = /(%% begin status %%)([\s\S]*?)(%% end status %%)/;
  const m = original.match(re);
  if (!m) return false;

  const inner = m[2];
  // Match hashtags. Allow letters, digits, hyphens, slashes, underscores.
  const tagRe = /#[\w/\-]+/g;
  const found = [...inner.matchAll(tagRe)].map((x) => x[0]);
  const unique = [...new Set(found)];
  const finalTags = unique.length > 0 ? unique : [defaultTag];

  // Canonical layout: marker, newline, tags joined by a space, newline, marker.
  const cleaned = `\n${finalTags.join(" ")}\n`;

  if (cleaned === inner) return false;
  const updated = original.replace(re, (_, a, _b, c) => `${a}${cleaned}${c}`);
  await app.vault.modify(file, updated);
  return true;
}

module.exports = ensureStatusDefault;
