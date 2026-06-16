#!/usr/bin/env python3
"""Extract a Markdown TOC from the PDF attached to a Zotero item.

Looks up the citekey in zotero.sqlite (read-only, copied to a tempfile so
Zotero's exclusive lock doesn't block us), finds the first PDF attachment,
and prints a nested bullet list of the PDF's bookmark outline with page
numbers. If the PDF has no embedded outline, prints an HTML comment
explaining that and exits 0 (so the caller can still write *something*
into the note).

Usage:
    extract_pdf_toc.py --citekey <key> --zotero-db <path-to-zotero.sqlite>

Setup (once):
    pip3 install --user pypdf
"""
from __future__ import annotations

import argparse
import os
import shutil
import sqlite3
import sys
import tempfile


def find_pdf_path(zotero_db: str, citekey: str) -> str | None:
    """Return the absolute path of the first PDF attached to <citekey>, or None."""
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


def render_outline(pdf_path: str) -> str:
    try:
        from pypdf import PdfReader  # type: ignore
    except ImportError:
        return "<!-- TOC: pypdf not installed. Run: pip3 install --user pypdf -->"

    reader = PdfReader(pdf_path)
    outlines = reader.outline
    if not outlines:
        return "<!-- TOC: PDF has no embedded outline (bookmarks). -->"

    entries: list[tuple[int, str, int | None, float | None]] = []

    def walk(items, depth: int = 0):
        for item in items:
            if isinstance(item, list):
                walk(item, depth + 1)
            else:
                title = (getattr(item, "title", "") or "").strip()
                if not title:
                    continue
                try:
                    page = reader.get_destination_page_number(item) + 1
                except Exception:
                    page = None
                top = getattr(item, "top", None)
                # `top` may be an IndirectObject in some PDFs; coerce.
                try:
                    top = float(top) if top is not None else None
                except Exception:
                    top = None
                entries.append((depth, title, page, top))

    walk(outlines)
    if not entries:
        return "<!-- TOC: outline parsed but contained no titles. -->"

    # If there is exactly one top-level entry (the doc title), drop it and
    # shift everything up so the section names live at depth 0.
    depth0 = [e for e in entries if e[0] == 0]
    if len(depth0) == 1 and len(entries) > 1:
        entries = [(d - 1, t, p, y) for (d, t, p, y) in entries if d > 0]

    lines: list[str] = []
    for d, t, p, y in entries:
        indent = "    " * d
        suffix = f" \u2014 p. {p}" if p else ""
        # Embed y as an HTML comment so groupHighlightsBySection can
        # disambiguate annotations on chapter-transition pages.
        ycomment = f" <!-- y={y:.1f} -->" if y is not None else ""
        lines.append(f"{indent}- {t}{suffix}{ycomment}")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--citekey", required=True)
    ap.add_argument(
        "--zotero-db",
        required=True,
        help="Path to Zotero zotero.sqlite",
    )
    args = ap.parse_args()

    if not os.path.isfile(args.zotero_db):
        print(f"<!-- TOC: Zotero DB not found at {args.zotero_db} -->")
        return 0

    pdf = find_pdf_path(args.zotero_db, args.citekey)
    if not pdf:
        print(f"<!-- TOC: no PDF attachment found for citekey '{args.citekey}' -->")
        return 0
    if not os.path.isfile(pdf):
        print(f"<!-- TOC: PDF path not on disk: {pdf} -->")
        return 0

    print(render_outline(pdf))
    return 0


if __name__ == "__main__":
    sys.exit(main())
