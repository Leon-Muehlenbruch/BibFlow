#!/usr/bin/env python3
"""
Fetch quality metrics for every paper note in an Obsidian literature folder
and write a sortable markdown table.

Sources (all free, no auth):
  - OpenAlex:         citation count, FWCI, OA status, journal info
  - Semantic Scholar: influential citation count, reference count

Notes are expected to have YAML frontmatter with at least a `doi:` field.
"""
from __future__ import annotations
import json, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

# Paths are resolved relative to this script's location so the script keeps
# working if the vault moves. Script is expected to live at
# <vault>/0/fetch_metrics.py; adjust VAULT_ROOT if you move it elsewhere.
SCRIPT_DIR = Path(__file__).resolve().parent       # <vault>/0 Meta/Library
VAULT_ROOT = SCRIPT_DIR.parent.parent                     # <vault>
LIT_DIR  = VAULT_ROOT / "1 Literature"
OUT_PATH = SCRIPT_DIR / "Paper Metrics.md"
CONTACT = "leonmuehlenbruch@gmail.com"  # polite-pool for OpenAlex

UA = f"PaperMetrics/1.0 (mailto:{CONTACT})"

def http_json(url: str, timeout: int = 20) -> dict | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        print(f"  ! {url[:80]}... -> {e}", file=sys.stderr)
        return None

def parse_frontmatter(text: str) -> dict:
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    block = text[3:end].strip()
    data: dict = {}
    key = None
    for line in block.splitlines():
        if not line.strip():
            continue
        if line.startswith("  - "):  # list continuation
            if key:
                val = line[4:].strip().strip('"').strip("'")
                data.setdefault(key, []).append(val)
            continue
        m = re.match(r'([A-Za-z_][\w-]*):\s*(.*)$', line)
        if m:
            key, rest = m.group(1), m.group(2).strip()
            if rest == "":
                data[key] = []
            else:
                data[key] = rest.strip('"').strip("'")
    return data

def fetch_openalex(doi: str) -> dict:
    d = http_json(f"https://api.openalex.org/works/https://doi.org/{doi}?mailto={CONTACT}")
    if not d:
        return {}
    src = (d.get("primary_location") or {}).get("source") or {}
    return {
        "oa_id": d.get("id"),
        "citations": d.get("cited_by_count"),
        "fwci": d.get("fwci"),
        "is_oa": d.get("open_access", {}).get("is_oa"),
        "publication_year": d.get("publication_year"),
        "journal": src.get("display_name"),
        "journal_id": src.get("id"),
        "referenced_works_count": len(d.get("referenced_works") or []),
        "type": d.get("type"),
    }

def fetch_openalex_source(source_id: str) -> dict:
    if not source_id:
        return {}
    sid = source_id.rsplit("/", 1)[-1]
    d = http_json(f"https://api.openalex.org/sources/{sid}?mailto={CONTACT}")
    if not d:
        return {}
    stats = d.get("summary_stats") or {}
    return {
        "journal_2yr_mean_citedness": stats.get("2yr_mean_citedness"),
        "journal_h_index": stats.get("h_index"),
        "journal_i10_index": stats.get("i10_index"),
        "journal_works_count": d.get("works_count"),
        "journal_cited_by_count": d.get("cited_by_count"),
    }

def fetch_semantic_scholar(doi: str) -> dict:
    url = (
        f"https://api.semanticscholar.org/graph/v1/paper/DOI:{urllib.parse.quote(doi)}"
        "?fields=citationCount,influentialCitationCount,referenceCount,venue,year"
    )
    d = http_json(url)
    if not d:
        return {}
    return {
        "s2_citations": d.get("citationCount"),
        "s2_influential": d.get("influentialCitationCount"),
        "s2_references": d.get("referenceCount"),
    }

def cites_per_year(citations, year) -> float | None:
    if citations is None or not year:
        return None
    try:
        y = int(year)
    except Exception:
        return None
    age = max(1, datetime.now(timezone.utc).year - y + 1)
    return round(citations / age, 1)

def num(x, fmt="{}"):
    return "–" if x is None else fmt.format(x)

def main():
    rows = []
    notes = sorted(LIT_DIR.glob("*.md"))
    print(f"Found {len(notes)} notes")
    for p in notes:
        fm = parse_frontmatter(p.read_text(encoding="utf-8"))
        doi = fm.get("doi")
        if not doi:
            print(f"  skip (no doi): {p.name}")
            continue
        print(f"- {p.name}  doi={doi}")
        oa = fetch_openalex(doi)
        time.sleep(0.2)
        src = fetch_openalex_source(oa.get("journal_id", ""))
        time.sleep(0.2)
        s2 = fetch_semantic_scholar(doi)
        time.sleep(0.3)
        citations = oa.get("citations")
        row = {
            "citekey": fm.get("citekey", p.stem),
            "intext": fm.get("intext") or fm.get("citekey", p.stem),
            "note": p.stem,
            "title": fm.get("title", ""),
            "year": fm.get("year") or oa.get("publication_year"),
            "journal": fm.get("journal") or oa.get("journal"),
            "citations": citations,
            "cites_per_year": cites_per_year(citations, fm.get("year") or oa.get("publication_year")),
            "fwci": oa.get("fwci"),
            "s2_influential": s2.get("s2_influential"),
            "s2_citations": s2.get("s2_citations"),
            "journal_2yr": src.get("journal_2yr_mean_citedness"),
            "journal_h": src.get("journal_h_index"),
            "is_oa": oa.get("is_oa"),
            "doi": doi,
        }
        rows.append(row)

    # Sort by FWCI (desc), then cites/yr (desc)
    def sort_key(r):
        return (
            -(r["fwci"] if r["fwci"] is not None else -1),
            -(r["cites_per_year"] if r["cites_per_year"] is not None else -1),
        )
    rows.sort(key=sort_key)

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# Paper Metrics",
        f"*Generated {now} from OpenAlex + Semantic Scholar. "
        "Sorted by FWCI (field-weighted citation impact), then citations/year.*",
        "## Column guide",
        "- **Citations**: total citations ([OpenAlex](https://openalex.org/)).",
        "- **Cites/yr**: citations ÷ years since publication.",
        "- **FWCI**: field-weighted citation impact. 1.0 = average in its field/year; 2.0 = twice the average.",
        "- **Infl.**: Semantic Scholar's *influential* citations.",
        "- **Journal 2y**: the journal's mean citedness over the last 2 years (OpenAlex's free IF analogue).",
        "- **Journal h**: h-index of the journal itself.",
        "- **OA**: open access.",
        "",
        "| # | Paper | Title | Year | Journal | Citations | Cites/yr | FWCI | Infl. | Journal 2y | Journal h | OA |",
        "|--:|-------|-------|:----:|---------|--------:|--------:|-----:|-----:|---------:|--------:|:--:|",
    ]
    for i, r in enumerate(rows, 1):
        title = (r["title"] or "").replace("|", "\\|")
        journal = (r["journal"] or "").replace("|", "\\|")
        link = f"[[{r['note']}\\|{r['intext']}]]"
        lines.append(
            "| {i} | {link} | {title} | {year} | {journal} | {cit} | {cpy} | {fwci} | {infl} | {j2} | {jh} | {oa} |".format(
                i=i,
                link=link,
                title=title,
                year=num(r["year"]),
                journal=journal or "–",
                cit=num(r["citations"]),
                cpy=num(r["cites_per_year"]),
                fwci=num(r["fwci"], "{:.2f}"),
                infl=num(r["s2_influential"]),
                j2=num(r["journal_2yr"], "{:.2f}"),
                jh=num(r["journal_h"]),
                oa="✅" if r["is_oa"] else ("–" if r["is_oa"] is None else ""),
            )
        )

    lines += [
        "",
        "## Alternative sorts",
        "### By total citations",
        "",
        "| # | Paper | Year | Citations | Cites/yr | FWCI |",
        "|--:|-------|:----:|--------:|--------:|-----:|",
    ]
    for i, r in enumerate(sorted(rows, key=lambda r: -(r["citations"] or -1)), 1):
        lines.append(
            f"| {i} | [[{r['note']}\\|{r['intext']}]] | {num(r['year'])} | "
            f"{num(r['citations'])} | {num(r['cites_per_year'])} | {num(r['fwci'], '{:.2f}')} |"
        )

    lines += [
        "### By citations per year",
        "",
        "| # | Paper | Year | Citations | Cites/yr | FWCI |",
        "|--:|-------|:----:|--------:|--------:|-----:|",
    ]
    for i, r in enumerate(sorted(rows, key=lambda r: -(r["cites_per_year"] or -1)), 1):
        lines.append(
            f"| {i} | [[{r['note']}\\|{r['intext']}]] | {num(r['year'])} | "
            f"{num(r['citations'])} | {num(r['cites_per_year'])} | {num(r['fwci'], '{:.2f}')} |"
        )

    lines += [
        "",
        "## Running the Script",
        "Run from your vault root (or use the **Refresh Paper Metrics** Templater command):",
        "``````",
        'python3 "0 Meta/Library/fetch_metrics.py"',
        "``````",
    ]

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nWrote {OUT_PATH} ({len(rows)} papers)")

if __name__ == "__main__":
    main()
