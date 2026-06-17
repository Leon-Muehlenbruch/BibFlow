#!/usr/bin/env python3
"""
Fetch the reference list of a paper note and write it into the note as an
auto-generated section of Obsidian links.

Usage
-----
    python3 fetch_references.py <citekey>
    python3 fetch_references.py zhang2023microbialinduced

What it does
------------
1. Reads <vault>/1 Literature/Paper Notes/<citekey>.md, pulls its DOI from the YAML.
2. Calls OpenAlex for the paper's `referenced_works` (list of OpenAlex IDs).
3. Batch-fetches metadata for every reference (title, authors, year, journal).
4. For each reference, generates a Better-BibTeX-style citekey
       <lastname><year><firstsignificanttitleword>
   and an in-text citation ("Zhang et al., 2023").
5. Writes a `## Cited works` section full of `[[citekey|Author, Year]]` links
   between AUTOGEN markers in the note.

Citekey reuse
-------------
Before generating a new citekey for a reference, the script checks whether
that reference's DOI is already in your library. If so, it reuses the
existing citekey from that note — so cross-references between your own
papers link to the real notes, not ghost nodes.

Zotero-refresh survival
-----------------------
The section is wrapped in AUTOGEN markers. See "Persistence" in the README
for how to configure your Zotero Integration template so a re-import
doesn't wipe this section.
"""
from __future__ import annotations
import argparse, json, re, sys, time, unicodedata, urllib.request
from datetime import date
from pathlib import Path

# --- paths (resolved relative to this script) --------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent       # <vault>/0 Meta/Library
VAULT_ROOT = SCRIPT_DIR.parent.parent                     # <vault>
LIT_DIR    = VAULT_ROOT / "1 Literature" / "Paper Notes"

CONTACT = "leonmuehlenbruch@gmail.com"             # OpenAlex polite pool
UA = f"PaperRefs/1.0 (mailto:{CONTACT})"

BEGIN_MARKER = "%% begin references %%"
END_MARKER   = "%% end references %%"
# Pre-%%-marker versions (auto-migrated on next run)
LEGACY_BEGIN = "<!-- AUTOGEN:references BEGIN -->"
LEGACY_END   = "<!-- AUTOGEN:references END -->"

# Title words skipped when building a citekey's title-token
TITLE_STOPWORDS = {
    "a", "an", "the",
    "on", "of", "and", "or", "for", "to", "in", "with", "at", "from",
    "by", "as", "is", "are", "be",
}


# --- small utilities ---------------------------------------------------------
def http_json(url: str, timeout: int = 30):
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        print(f"  ! {url[:90]}... -> {e}", file=sys.stderr)
        return None


def strip_accents(s: str) -> str:
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", strip_accents(s).lower())


def normalize_doi(doi: str) -> str:
    if not doi:
        return ""
    doi = doi.strip().lower()
    for prefix in ("https://doi.org/", "http://doi.org/", "doi:"):
        if doi.startswith(prefix):
            doi = doi[len(prefix):]
    return doi


# --- citekey / citation generation -------------------------------------------
def first_significant_title_word(title: str) -> str:
    for w in (title or "").split():
        s = slug(w)
        if s and s not in TITLE_STOPWORDS:
            return s
    return ""


def last_name(full_name: str) -> str:
    # "N. Erdmann" -> "Erdmann", "van der Berg" -> "Berg" (simple last-token rule)
    parts = (full_name or "").split()
    return parts[-1] if parts else ""


def gen_citekey(first_author: str, year, title: str) -> str:
    return f"{slug(last_name(first_author))}{year}{first_significant_title_word(title)}"


def gen_intext(authors: list[str], year) -> str:
    lasts = [last_name(a) for a in authors if a]
    if not lasts:
        return f"?, {year}"
    if len(lasts) == 1:
        return f"{lasts[0]}, {year}"
    if len(lasts) == 2:
        return f"{lasts[0]} & {lasts[1]}, {year}"
    return f"{lasts[0]} et al., {year}"


# --- YAML frontmatter parsing ------------------------------------------------
def extract_frontmatter(text: str) -> str:
    if not text.startswith("---"):
        return ""
    end = text.find("\n---", 3)
    return text[3:end] if end != -1 else ""


def get_doi_from_note(path: Path) -> str | None:
    fm = extract_frontmatter(path.read_text(encoding="utf-8"))
    m = re.search(r'^doi:\s*"?([^"\n]+?)"?\s*$', fm, re.MULTILINE)
    return m.group(1).strip() if m else None


def get_citekey_from_note(path: Path) -> str | None:
    fm = extract_frontmatter(path.read_text(encoding="utf-8"))
    m = re.search(r'^citekey:\s*"?([^"\n]+?)"?\s*$', fm, re.MULTILINE)
    return m.group(1).strip() if m else None


def build_library_doi_index() -> dict[str, str]:
    """Return {normalized_doi: citekey} for every note in the literature folder."""
    idx = {}
    for p in LIT_DIR.glob("*.md"):
        doi = get_doi_from_note(p)
        citekey = get_citekey_from_note(p) or p.stem
        if doi:
            idx[normalize_doi(doi)] = citekey
    return idx


# --- OpenAlex queries --------------------------------------------------------
def fetch_paper_refs(doi: str) -> list[str]:
    url = f"https://api.openalex.org/works/https://doi.org/{doi}?mailto={CONTACT}"
    d = http_json(url)
    if not d:
        return []
    return d.get("referenced_works") or []


def fetch_works_batch(oa_ids: list[str], batch_size: int = 50) -> dict[str, dict]:
    """Fetch metadata for a list of OpenAlex work IDs in batches."""
    results: dict[str, dict] = {}
    total = len(oa_ids)
    for i in range(0, total, batch_size):
        batch = oa_ids[i:i + batch_size]
        ids_filter = "|".join(x.rsplit("/", 1)[-1] for x in batch)
        url = (
            f"https://api.openalex.org/works"
            f"?filter=openalex:{ids_filter}&per-page={batch_size}&mailto={CONTACT}"
        )
        d = http_json(url)
        if d and d.get("results"):
            for w in d["results"]:
                key = w.get("id", "").rsplit("/", 1)[-1]
                results[key] = w
        print(f"  fetched {min(i + batch_size, total)}/{total}")
        time.sleep(0.25)  # stay well under OpenAlex's polite-pool rate limit
    return results


def extract_meta(work: dict) -> dict:
    authors = [
        (a.get("author") or {}).get("display_name", "")
        for a in (work.get("authorships") or [])
    ]
    authors = [a for a in authors if a]
    src = (work.get("primary_location") or {}).get("source") or {}
    doi = normalize_doi(work.get("doi") or "")
    return {
        "title":   (work.get("title") or "").strip(),
        "year":    work.get("publication_year"),
        "authors": authors,
        "journal": src.get("display_name") or "",
        "doi":     doi,
    }


# --- section rendering / upsert ---------------------------------------------
def render_section(refs: list[dict], library: dict[str, str]) -> str:
    usable = [r for r in refs if r["title"] and r["year"] and r["authors"]]
    usable.sort(key=lambda r: (last_name(r["authors"][0]).lower(), r["year"]))

    # The "## Cited works" heading lives in the Zotero Integration template,
    # outside the persist block — so the script only writes the block contents.
    lines = [BEGIN_MARKER]
    in_library = 0
    for r in usable:
        first_author = r["authors"][0]
        if r["doi"] and r["doi"] in library:
            citekey = library[r["doi"]]
            in_library += 1
        else:
            citekey = gen_citekey(first_author, r["year"], r["title"])
        intext = gen_intext(r["authors"], r["year"])
        lines.append(f"- [[{citekey}|{intext}]]  \n  <sub>{r['title']}</sub>")

    lines.append("")
    today = date.today().isoformat()
    lines.append(
        f"<sub>{in_library} of {len(usable)} references are already in your library "
        f"(as of {today}).</sub>"
    )
    lines.append(END_MARKER)
    return "\n".join(lines)


def upsert_section(text: str, section: str) -> str:
    # Preferred: %% begin references %% ... %% end references %%
    # (matches the Zotero Integration template's {% persist "references" %} block)
    if BEGIN_MARKER in text and END_MARKER in text:
        start = text.index(BEGIN_MARKER)
        end   = text.index(END_MARKER) + len(END_MARKER)
        return text[:start] + section + text[end:]
    # Legacy HTML-comment markers from earlier script versions — migrate to %% form,
    # and drop any stale "## Cited works" heading the old renderer left above them.
    if LEGACY_BEGIN in text and LEGACY_END in text:
        start = text.index(LEGACY_BEGIN)
        end   = text.index(LEGACY_END) + len(LEGACY_END)
        before = text[:start].rstrip()
        if before.endswith("## Cited works"):
            before = before[:-len("## Cited works")].rstrip()
        before += "\n\n## Cited works\n"
        return before + section + text[end:]
    # No markers yet — append a fresh section at the end.
    return text.rstrip() + "\n\n## Cited works\n" + section + "\n"


# --- main --------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("citekey", help="Citekey of the paper to process (e.g. zhang2023microbialinduced)")
    args = ap.parse_args()

    note_path = LIT_DIR / f"{args.citekey}.md"
    if not note_path.exists():
        sys.exit(f"Note not found: {note_path}")

    text = note_path.read_text(encoding="utf-8")
    doi = get_doi_from_note(note_path)
    if not doi:
        sys.exit(f"No DOI in frontmatter of {note_path.name}")

    print(f"Processing {args.citekey}  (DOI {doi})")

    library = build_library_doi_index()
    print(f"Indexed {len(library)} DOIs from existing notes")

    print("Fetching referenced_works from OpenAlex...")
    ref_ids = fetch_paper_refs(doi)
    print(f"  {len(ref_ids)} references listed")

    if not ref_ids:
        section = (
            f"{BEGIN_MARKER}\n## Cited works\n\n"
            "*No references found via OpenAlex (the publisher may not have "
            "deposited a reference list).*\n\n"
            f"{END_MARKER}"
        )
        note_path.write_text(upsert_section(text, section), encoding="utf-8")
        print("Wrote empty section.")
        return

    works = fetch_works_batch(ref_ids)
    print(f"Resolved {len(works)}/{len(ref_ids)} via OpenAlex")

    refs = [extract_meta(w) for w in works.values()]
    section = render_section(refs, library)
    note_path.write_text(upsert_section(text, section), encoding="utf-8")
    print(f"Updated {note_path.name}")


if __name__ == "__main__":
    main()
