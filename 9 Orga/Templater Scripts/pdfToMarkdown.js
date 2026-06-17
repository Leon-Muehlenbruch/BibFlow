// Templater user function — converts the PDF attached to a Zotero item into
// a searchable Markdown file under "1 Literature/Full Text/", by shelling out
// to the Python helper (pdf_to_markdown.py) next to this file. Returns the
// new file's vault-relative path (or null on failure).
//
// Wiring (one-time):
//   1. Templater settings → "User script files" → folder = "9 Orga/Templater Scripts"
//      (BibFlow ships this pre-set).
//   2. In that folder: python3 -m venv .venv && .venv/bin/pip install pypdf pymupdf4llm
//   3. python3 on PATH (default on macOS).
//
// Usage from a Templater command:
//   <% await tp.user.pdfToMarkdown(citekey) %>
//
// Optional second argument overrides the path to zotero.sqlite. Defaults to
// ~/Zotero/zotero.sqlite (the standard macOS location).

async function pdfToMarkdown(citekey, zoteroDbOverride) {
  if (!citekey) {
    new Notice("pdfToMarkdown: no citekey");
    return null;
  }

  const path = require("path");
  const os = require("os");
  const fs = require("fs");
  const { execFile } = require("child_process");

  const adapter = app.vault.adapter;
  const vaultPath =
    typeof adapter.getBasePath === "function"
      ? adapter.getBasePath()
      : adapter.basePath;

  const scriptsDir = path.join(vaultPath, "9 Orga", "Templater Scripts");
  const helper = path.join(scriptsDir, "pdf_to_markdown.py");
  const outDir = path.join(vaultPath, "1 Literature", "Full Text");
  const zoteroDb =
    zoteroDbOverride || path.join(os.homedir(), "Zotero", "zotero.sqlite");

  // Prefer the bundled venv (pymupdf4llm lives there); fall back to system python3.
  const venvPython = path.join(scriptsDir, ".venv", "bin", "python");
  const pythonCmd = fs.existsSync(venvPython) ? venvPython : "python3";

  return await new Promise((resolve) => {
    execFile(
      pythonCmd,
      [helper, "--citekey", citekey, "--zotero-db", zoteroDb, "--out-dir", outDir],
      { timeout: 120000, maxBuffer: 64 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          console.error("[pdfToMarkdown] error:", err, stderr);
          // The helper prints its error as the last stderr line (PyMuPDF/OCR
          // chatter may precede it), so surface that rather than the first.
          const msg =
            (stderr || "").trim().split("\n").filter(Boolean).pop() || err.message;
          new Notice(`Convert to Markdown failed: ${msg}`);
          resolve(null);
          return;
        }
        const outPath = (stdout || "").trim().split("\n").pop();
        if (!outPath) {
          new Notice("Convert to Markdown: helper produced no output");
          resolve(null);
          return;
        }
        // Hand back a vault-relative path so the caller can open it directly.
        const rel = outPath.startsWith(vaultPath)
          ? outPath.slice(vaultPath.length).replace(/^[/\\]+/, "")
          : outPath;
        resolve(rel);
      }
    );
  });
}

module.exports = pdfToMarkdown;
