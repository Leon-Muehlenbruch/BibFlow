#!/usr/bin/env python3
"""Convert the PDF attached to a Zotero item into a searchable Markdown file.

Looks up the citekey in zotero.sqlite (read-only, copied to a tempfile so
Zotero's exclusive lock doesn't block us), finds the first PDF attachment,
converts it to Markdown with pymupdf4llm, and writes
    <out-dir>/<citekey> (full text).md
The output path is printed to stdout so the caller can open the file.

Why a separate full-text file: with many papers imported, plain-Markdown
full text lets you Cmd+F across the vault to find exactly which paper a
quote came from — something the PDF and the synthesis note can't give you.

Usage:
    pdf_to_markdown.py --citekey <key> --zotero-db <zotero.sqlite> --out-dir <dir>

Setup (once, in the Templater Scripts venv):
    .venv/bin/pip install pymupdf4llm
"""
from __future__ import annotations

import argparse
import os
import shutil
import sqlite3
import sys
import tempfile


def find_pdf_path(zotero_db: str, citekey: str) -> str | None:
    """Return the absolute path of the first PDF attached to <citekey>, or None.

    Mirrors extract_pdf_toc.py so the two helpers resolve attachments the
    same way.
    """
    with tempfile.TemporaryDirectory() as tmp:
        db_copy = os.path.join(tmp, "zotero.sqlite")
        shutil.copyfile(zotero_db, db_copy)
        conn = sqlite3.connect(f"file:{db_copy}?mode=ro", uri=True)
        cur = conn.cursor()

        cur.execute(
            """
            SELECT i.itemID
            FROM itemData id
            JOIN fields f ON id.fieldID = f.fieldID
            JOIN itemDataValues idv ON id.valueID = idv.valueID
            JOIN items i ON id.itemID = i.itemID
            WHERE f.fieldName = 'citationKey' AND idv.value = ?
            """,
            (citekey,),
        )
        row = cur.fetchone()
        if not row:
            return None
        (item_id,) = row

        cur.execute(
            """
            SELECT i.key, ia.path
            FROM itemAttachments ia
            JOIN items i ON ia.itemID = i.itemID
            WHERE ia.parentItemID = ? AND ia.contentType = 'application/pdf'
            ORDER BY ia.itemID
            """,
            (item_id,),
        )
        atts = cur.fetchall()
        if not atts:
            return None
        att_key, att_path = atts[0]

    zotero_dir = os.path.dirname(zotero_db)
    if att_path and att_path.startswith("storage:"):
        return os.path.join(zotero_dir, "storage", att_key, att_path[len("storage:"):])
    if att_path and os.path.isabs(att_path):
        return att_path
    if att_path:
        return os.path.join(zotero_dir, att_path)
    return None


def convert_to_markdown(pdf_path: str) -> str:
    """Convert a PDF to Markdown text using pymupdf4llm. Raises on failure.

    PyMuPDF and its Tesseract OCR path write parser/progress messages to the
    process's stdout. Redirect the OS-level stdout (fd 1) to stderr for the
    duration of the conversion so none of that pollutes our stdout contract —
    which is the output path, alone, on the final line.
    """
    import pymupdf4llm  # imported lazily so the import error is reportable

    sys.stdout.flush()
    saved_fd = os.dup(1)
    os.dup2(2, 1)
    try:
        return pymupdf4llm.to_markdown(pdf_path, show_progress=False)
    finally:
        sys.stdout.flush()
        os.dup2(saved_fd, 1)
        os.close(saved_fd)


def build_document(citekey: str, body: str) -> str:
    """Wrap the converted body with a small header that links back to the note."""
    header = (
        "---\n"
        "tags: [fulltext]\n"
        "---\n"
        f"> **Full text of [[{citekey}]]** — converted from the PDF with "
        "pymupdf4llm. This file is overwritten on every re-conversion; keep "
        "your own notes in the paper note, not here.\n\n"
    )
    return header + body.strip() + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--citekey", required=True)
    ap.add_argument("--zotero-db", required=True, help="Path to Zotero zotero.sqlite")
    ap.add_argument("--out-dir", required=True, help="Folder to write the Markdown into")
    args = ap.parse_args()

    if not os.path.isfile(args.zotero_db):
        print(f"Zotero DB not found at {args.zotero_db}", file=sys.stderr)
        return 2

    try:
        import pymupdf4llm  # noqa: F401  (fail fast with a clear message)
    except ImportError:
        print(
            "pymupdf4llm not installed. Run: "
            '.venv/bin/pip install pymupdf4llm  (in "9 Orga/Templater Scripts")',
            file=sys.stderr,
        )
        return 3

    pdf = find_pdf_path(args.zotero_db, args.citekey)
    if not pdf:
        print(f"No PDF attachment found for citekey '{args.citekey}'", file=sys.stderr)
        return 4
    if not os.path.isfile(pdf):
        print(f"PDF path not on disk: {pdf}", file=sys.stderr)
        return 4

    try:
        body = convert_to_markdown(pdf)
    except Exception as e:  # noqa: BLE001 — surface any converter error to the caller
        print(f"Conversion failed: {e}", file=sys.stderr)
        return 5

    os.makedirs(args.out_dir, exist_ok=True)
    out_path = os.path.join(args.out_dir, f"{args.citekey} (full text).md")
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(build_document(args.citekey, body))

    # The caller reads this line to open the file.
    print(out_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
