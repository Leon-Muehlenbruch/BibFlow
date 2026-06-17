// Templater user function — force a vault commit that BYPASSES git hooks
// (`git commit --no-verify`).
//
// Why this exists:
//   • The repo can have a pre-commit guard that refuses commits staging many
//     deletions. obsidian-git offers no per-commit way to skip it, so this
//     shells out to native git with --no-verify.
//
// Notes on the Templater user-script context:
//   • Do NOT `require('obsidian')` here — that module is only injected for
//     plugins, not for user scripts, and requiring it fails the whole script
//     to load (which then breaks every Templater action, incl. the Launcher).
//   • We get `Notice` from the `tp.obsidian` module that Templater passes in,
//     use the global `app`, and build the timestamp with plain Date.
//   • Node built-ins (child_process, fs) require fine.
//
// Behaviour: stage everything (`git add -A`), commit with --no-verify and a
// clearly-marked override message. Commit-only — does NOT push.

async function gitCommitNoVerify(tp) {
  const { execFileSync } = require("child_process");
  const fs = require("fs");

  const Notice = tp && tp.obsidian ? tp.obsidian.Notice : null;
  const notify = (msg, timeout) => {
    if (Notice) new Notice(msg, timeout);
    else console.log("[no-verify]", msg);
  };

  // GUI apps on macOS often run with a minimal PATH — prefer absolute paths.
  const candidates = ["/usr/bin/git", "/opt/homebrew/bin/git", "/usr/local/bin/git"];
  const gitBin =
    candidates.find((p) => {
      try {
        return fs.existsSync(p);
      } catch (e) {
        return false;
      }
    }) || "git";

  const cwd = app.vault.adapter.getBasePath
    ? app.vault.adapter.getBasePath()
    : app.vault.adapter.basePath;

  const run = (args) => execFileSync(gitBin, args, { cwd, encoding: "utf8" });

  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  const msg = `vault backup (--no-verify override): ${stamp}`;

  try {
    run(["add", "-A"]);
    const out = run(["commit", "--no-verify", "-m", msg]).trim();
    const summary = out.split("\n").slice(0, 2).join(" — ");
    notify(`✅ Committed (deletion guard bypassed)\n${summary}`, 8000);
    console.log("[no-verify]", out);
  } catch (e) {
    const blob = `${e.stdout || ""}${e.stderr || ""}${e.message || ""}`;
    if (/nothing to commit/i.test(blob)) {
      notify("Nothing to commit — working tree is clean.", 6000);
    } else {
      notify(`Git commit failed:\n${blob.slice(0, 300)}`, 10000);
    }
    console.error("[no-verify] failed:", blob);
  }
}

module.exports = gitCommitNoVerify;
