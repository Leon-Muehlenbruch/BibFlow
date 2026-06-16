// Templater user function — force a vault commit that BYPASSES git hooks
// (`git commit --no-verify`).
//
// Why this exists:
//   • The repo has a pre-commit guard (.git/hooks/pre-commit) that refuses
//     any commit staging ≥10 deletions, to stop an accidental mass-delete
//     from being silently backed up.
//   • obsidian-git's "commit-and-sync" command offers no per-commit way to
//     skip that hook, so this shells out to native git with --no-verify.
//
// Behaviour (mirrors the normal auto-backup, but bypassing the hook):
//   1. Stage everything (`git add -A`) — matches autoCommitOnlyStaged:false.
//   2. Commit with --no-verify and a clearly-marked override message.
//   3. Commit-only — does NOT push. Sync afterwards via "Commit and Sync Now"
//      or let obsidian-git auto-sync push it.
//
// Use this ONLY after you have reviewed the staged deletions. It is the
// deliberate override, not a routine backup.

const { Notice, moment } = require("obsidian");

async function gitCommitNoVerify() {
  const { execFileSync } = require("child_process");
  const fs = require("fs");

  // GUI apps on macOS often run with a minimal PATH, so prefer absolute
  // paths and fall back to a bare `git` only as a last resort.
  const candidates = ["/usr/bin/git", "/opt/homebrew/bin/git", "/usr/local/bin/git"];
  const gitBin = candidates.find((p) => { try { return fs.existsSync(p); } catch (e) { return false; } }) || "git";

  const cwd = app.vault.adapter.getBasePath
    ? app.vault.adapter.getBasePath()
    : app.vault.adapter.basePath;

  // execFileSync passes argv directly (no shell) — the vault path with spaces
  // and the commit message need no quoting.
  const run = (args) => execFileSync(gitBin, args, { cwd, encoding: "utf8" });

  const stamp = (typeof moment !== "undefined")
    ? moment().format("YYYY-MM-DD HH:mm:ss")
    : new Date().toISOString();
  const msg = `vault backup (--no-verify override): ${stamp}`;

  try {
    run(["add", "-A"]);
    const out = run(["commit", "--no-verify", "-m", msg]).trim();
    const summary = out.split("\n").slice(0, 2).join(" — ");
    new Notice(`✅ Committed (deletion guard bypassed)\n${summary}`, 8000);
    console.log("[no-verify]", out);
  } catch (e) {
    const blob = `${e.stdout || ""}${e.stderr || ""}${e.message || ""}`;
    if (/nothing to commit/i.test(blob)) {
      new Notice("Nothing to commit — working tree is clean.", 6000);
    } else {
      new Notice(`Git commit failed:\n${blob.slice(0, 300)}`, 10000);
    }
    console.error("[no-verify] failed:", blob);
  }
}

module.exports = gitCommitNoVerify;
