#!/usr/bin/env python3
"""
Literature search backed by OpenAlex.

Reads <vault>/0/Paper Search.md, finds every ```search fenced block,
queries OpenAlex with the keywords + filters inside, and writes a
ranked result list between `%% results-begin/end: <section> %%` markers
right after the fence.

Each search section consists of:
  ## Section Name
  ```search
  keywords: term1 term2 term3           # (or a YAML list)
  from_year: 2015                        # optional
  to_year: 2026                          # optional
  min_citations: 5                       # optional
  max_results: 20                        # default 20, capped at 200
  type: article                          # optional (article, review, ...)
  sort_by: relevance                     # relevance | citations | date
  ```

On first run, the script inserts the `%% results-begin/end %%` marker
pair directly under the fence. On later runs it rewrites the content
between existing markers, so any manual edits inside the block will be
overwritten — keep your own notes OUTSIDE the markers.

Results that already exist in your library (DOI match against
`1 Literature/*.md`) are linked to the corresponding note via
`[[citekey|Author, Year]]` and marked with a ✓.
"""
from __future__ import annotations
import json, re, sys, time, unicodedata, urllib.parse, urllib.request
from datetime import date
from pathlib import Path

# --- paths -----------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent       # <vault>/0 Meta/Library
VAULT_ROOT = SCRIPT_DIR.parent.parent                     # <vault>
LIT_DIR    = VAULT_ROOT / "1 Literature"
NOTE_PATH  = SCRIPT_DIR / "Paper Search.md"

CONTACT = "leonmuehlenbruch@gmail.com"
UA = f"PaperSearch/1.0 (mailto:{CONTACT})"

TITLE_STOPWORDS = {
    "a", "an", "the",
    "on", "of", "and", "or", "for", "to", "in", "with", "at", "from",
    "by", "as", "is", "are", "be",
}


# --- small utilities -------------------------------------------------------
def http_json(url: str, timeout: int = 30):
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        print(f"  ! {url[:100]}... -> {e}", file=sys.stderr)
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


def first_significant_title_word(title: str) -> str:
    for w in (title or "").split():
        s = slug(w)
        if s and s not in TITLE_STOPWORDS:
            return s
    return ""


def last_name(full_name: str) -> str:
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


def as_int(v, default=None):
    try:
        return int(str(v).strip())
    except (ValueError, TypeError):
        return default


# --- library index (same idea as in fetch_references.py) ------------------
def extract_frontmatter(text: str) -> str:
    if not text.startswith("---"):
        return ""
    end = text.find("\n---", 3)
    return text[3:end] if end != -1 else ""


def get_fm_field(path: Path, field: str) -> str | None:
    fm = extract_frontmatter(path.read_text(encoding="utf-8"))
    m = re.search(rf'^{field}:\s*"?([^"\n]+?)"?\s*$', fm, re.MULTILINE)
    return m.group(1).strip() if m else None


def build_library_doi_index() -> dict[str, str]:
    idx = {}
    if not LIT_DIR.exists():
        return idx
    for p in LIT_DIR.glob("*.md"):
        doi = get_fm_field(p, "doi")
        citekey = get_fm_field(p, "citekey") or p.stem
        if doi:
            idx[normalize_doi(doi)] = citekey
    return idx


# --- parsing the search note ----------------------------------------------
SEARCH_FENCE_RE = re.compile(
    r"^```search\s*\n(.*?)^```\s*$",
    re.MULTILINE | re.DOTALL,
)


def parse_search_config(block: str) -> dict:
    """Minimal YAML-ish parser: `key: value`, `key: [a, b]`, or `key:` + list items."""
    data: dict = {}
    key = None
    for raw in block.splitlines():
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line.startswith("  - ") and key:
            val = line[4:].strip().strip('"').strip("'")
            if not isinstance(data.get(key), list):
                data[key] = []
            data[key].append(val)
            continue
        m = re.match(r'([A-Za-z_][\w-]*):\s*(.*)$', line)
        if m:
            key, rest = m.group(1), m.group(2).strip()
            if rest == "":
                data[key] = []
            elif rest.startswith("[") and rest.endswith("]"):
                inner = rest[1:-1]
                items = [
                    x.strip().strip('"').strip("'")
                    for x in inner.split(",")
                    if x.strip()
                ]
                data[key] = items
            else:
                data[key] = rest.strip('"').strip("'")
    return data


def find_section_name(text: str, fence_start: int) -> str:
    """Nearest `## Heading` above the fence — becomes the result-block name."""
    preceding = text[:fence_start]
    last = None
    for m in re.finditer(r"^##\s+(.+?)\s*$", preceding, re.MULTILINE):
        last = m
    return last.group(1).strip() if last else "unnamed"


def results_markers(name: str) -> tuple[str, str]:
    return (f"%% results-begin: {name} %%", f"%% results-end: {name} %%")


# --- OpenAlex query construction ------------------------------------------
OPENALEX_SELECT = ",".join([
    "id", "doi", "title", "display_name", "publication_year", "authorships",
    "cited_by_count", "primary_location", "abstract_inverted_index", "type",
    "open_access", "fwci",
])

SORT_MAP = {
    "relevance": "relevance_score:desc",
    "citations": "cited_by_count:desc",
    "date":      "publication_date:desc",
    "year":      "publication_year:desc",
}


def build_openalex_url(cfg: dict) -> str | None:
    kw = cfg.get("keywords")
    if isinstance(kw, list):
        query = " ".join(str(k) for k in kw)
    else:
        query = str(kw or "").strip()
    if not query:
        return None

    filters = []
    from_y = as_int(cfg.get("from_year"))
    to_y   = as_int(cfg.get("to_year"))
    if from_y and to_y:
        filters.append(f"publication_year:{from_y}-{to_y}")
    elif from_y:
        filters.append(f"publication_year:>{from_y - 1}")
    elif to_y:
        filters.append(f"publication_year:<{to_y + 1}")

    min_c = as_int(cfg.get("min_citations"))
    if min_c:
        filters.append(f"cited_by_count:>{min_c - 1}")

    ptype = cfg.get("type")
    if ptype:
        filters.append(f"type:{ptype}")

    max_r = max(1, min(as_int(cfg.get("max_results"), 20), 200))
    sort_by = SORT_MAP.get(str(cfg.get("sort_by") or "").strip(), SORT_MAP["relevance"])

    params = [
        f"search={urllib.parse.quote(query)}",
        f"per-page={max_r}",
        f"sort={sort_by}",
        f"select={OPENALEX_SELECT}",
        f"mailto={CONTACT}",
    ]
    if filters:
        params.append("filter=" + ",".join(filters))
    return "https://api.openalex.org/works?" + "&".join(params)


# --- result rendering ------------------------------------------------------
def reconstruct_abstract(inv_idx: dict, max_words: int = 60) -> str:
    if not inv_idx:
        return ""
    positions = []
    for word, plist in inv_idx.items():
        for p in plist:
            positions.append((p, word))
    positions.sort()
    words = [w for _, w in positions[:max_words]]
    text = " ".join(words)
    if len(positions) > max_words:
        text += "…"
    return text


def format_result(work: dict, library: dict[str, str], rank: int) -> list[str]:
    title = (work.get("title") or work.get("display_name") or "").strip()
    year  = work.get("publication_year") or ""
    doi   = normalize_doi(work.get("doi") or "")
    cites = work.get("cited_by_count")
    fwci  = work.get("fwci")
    oa    = (work.get("open_access") or {}).get("is_oa")
    src   = (work.get("primary_location") or {}).get("source") or {}
    journal = src.get("display_name") or ""

    authors = [
        (a.get("author") or {}).get("display_name", "")
        for a in (work.get("authorships") or [])
    ]
    authors = [a for a in authors if a]
    intext = gen_intext(authors, year)
    first_author = authors[0] if authors else ""

    in_lib_ck = library.get(doi) if doi else None
    marker = " ✓" if in_lib_ck else ""

    lines = [f"### {rank}. {intext} — {title}{marker}"]

    meta = []
    if journal:
        meta.append(f"*{journal}*")
    if cites is not None:
        meta.append(f"{cites} cites")
    if fwci is not None:
        meta.append(f"FWCI {fwci:.2f}")
    if oa:
        meta.append("📖 OA")
    if doi:
        meta.append(f"[DOI](https://doi.org/{doi})")
    if in_lib_ck:
        meta.append(f"[[{in_lib_ck}|in library]]")
    else:
        suggested = gen_citekey(first_author, year, title)
        if suggested:
            meta.append(f"key: `{suggested}`")
    if meta:
        lines.append(" · ".join(meta))

    abstract = reconstruct_abstract(work.get("abstract_inverted_index") or {})
    if abstract:
        lines.append("")
        lines.append(f"> {abstract}")
    lines.append("")
    return lines


def render_results_block(results: list[dict], meta_count: int | None, library: dict) -> str:
    today = date.today().isoformat()
    total = "?" if meta_count is None else f"~{meta_count}"
    lines = [
        f"*Fetched {today} — showing {len(results)} of {total} matching OpenAlex records.*",
        "",
    ]
    if not results:
        lines.append("*No results. Try loosening filters or broadening keywords.*")
    else:
        for i, w in enumerate(results, 1):
            lines.extend(format_result(w, library, i))
    return "\n".join(lines).rstrip()


# --- section upsert --------------------------------------------------------
def upsert_results(text: str, name: str, body: str, fallback_at: int) -> str:
    begin, end = results_markers(name)
    block = f"{begin}\n{body}\n{end}"
    if begin in text and end in text:
        s = text.index(begin)
        e = text.index(end) + len(end)
        return text[:s] + block + text[e:]
    # First run — insert right after the fence's closing ```
    insertion = f"\n\n{block}\n"
    return text[:fallback_at] + insertion + text[fallback_at:]


# --- main ------------------------------------------------------------------
def main():
    if not NOTE_PATH.exists():
        sys.exit(f"Missing search note: {NOTE_PATH}")

    text = NOTE_PATH.read_text(encoding="utf-8")
    library = build_library_doi_index()
    print(f"Indexed {len(library)} DOIs from existing notes")

    sections = []
    for m in SEARCH_FENCE_RE.finditer(text):
        sections.append({
            "name":     find_section_name(text, m.start()),
            "config":   parse_search_config(m.group(1)),
            "fence_end": m.end(),
        })

    if not sections:
        print("No ```search fences found. Add one to Paper Search.md.")
        return
    print(f"Found {len(sections)} search section(s)")

    # Deduplicate marker names so re-runs don't collide
    seen = {}
    for s in sections:
        n = s["name"]
        seen[n] = seen.get(n, 0) + 1
        if seen[n] > 1:
            s["name"] = f"{n} ({seen[n]})"

    # Query OpenAlex for each section
    for s in sections:
        url = build_openalex_url(s["config"])
        if not url:
            s["body"] = "*No keywords provided — add a `keywords:` line.*"
            print(f"  [{s['name']}] skipped (no keywords)")
            continue
        print(f"  [{s['name']}] querying...")
        data = http_json(url)
        if data is None:
            s["body"] = "*(query failed — see terminal output)*"
            continue
        results = data.get("results") or []
        count = (data.get("meta") or {}).get("count")
        s["body"] = render_results_block(results, count, library)
        print(f"    {len(results)} results (of {count} total)")
        time.sleep(0.25)  # polite-pool rate limiting

    # Rewrite in reverse so early fence_end offsets stay valid on first-run inserts
    out = text
    for s in reversed(sections):
        out = upsert_results(out, s["name"], s["body"], s["fence_end"])

    NOTE_PATH.write_text(out, encoding="utf-8")
    print(f"\nUpdated {NOTE_PATH.name}")


if __name__ == "__main__":
    main()
