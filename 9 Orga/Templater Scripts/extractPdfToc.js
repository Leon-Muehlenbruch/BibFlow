// Templater user function — extracts a Markdown TOC for a Zotero item
// by shelling out to the Python helper (extract_pdf_toc.py) sitting next
// to this file. Returns a Markdown string ready to drop into a note.
//
// Wiring (one-time):
//   1. Templater settings → "User script files" → set folder to:
//        9 Orga/Templater Scripts
//      (the folder this file lives in)
//   2. pip3 install --user pypdf
//   3. Make sure `python3` is on PATH (default on macOS).
//
// Usage from a Templater command or the Literature Note template:
//   <% await tp.user.extractPdfToc(citekey) %>
//
// Optional second argument overrides the path to zotero.sqlite. Defaults
// to ~/Zotero/zotero.sqlite, the standard macOS location.

async function extractPdfToc(citekey, zoteroDbOverride) {
  if (!citekey) {
    return "<!-- TOC: no citekey passed to extractPdfToc -->";
  }

  const path = require("path");
  const os = require("os");
  const { execFile } = require("child_process");

  // Vault path → resolve helper script. Works on macOS/Linux; on Windows
  // adjust pythonCmd below.
  const adapter = app.vault.adapter;
  const vaultPath =
    typeof adapter.getBasePath === "function"
      ? adapter.getBasePath()
      : adapter.basePath;

  const scriptsDir = path.join(vaultPath, "9 Orga", "Templater Scripts");
  const helper = path.join(scriptsDir, "extract_pdf_toc.py");
  const zoteroDb =
    zoteroDbOverride || path.join(os.homedir(), "Zotero", "zotero.sqlite");

  // Prefer the bundled venv (set up once via README instructions). Falls
  // back to system python3 if the venv is missing — useful on machines
  // where pypdf was installed globally.
  const fs = require("fs");
  const venvPython = path.join(scriptsDir, ".venv", "bin", "python");
  const pythonCmd = fs.existsSync(venvPython) ? venvPython : "python3";

  return await new Promise((resolve) => {
    execFile(
      pythonCmd,
      [helper, "--citekey", citekey, "--zotero-db", zoteroDb],
      { timeout: 20000, maxBuffer: 1 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          console.error("[extractPdfToc] error:", err, stderr);
          resolve(
            `<!-- TOC extraction failed: ${err.message.replace(/\n/g, " ")} -->`
          );
          return;
        }
        const out = (stdout || "").trim();
        resolve(out || "<!-- TOC: helper produced no output -->");
      }
    );
  });
}

module.exports = extractPdfToc;
