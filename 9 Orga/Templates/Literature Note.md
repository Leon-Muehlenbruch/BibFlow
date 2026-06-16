---
citekey: "{{citekey}}"
title: "{{title}}"
authors:
{%- for a in creators %}
  - "{{a.firstName}} {{a.lastName}}"
{%- endfor %}
year: "{{date | format('YYYY')}}"
journal: "{{publicationTitle}}"
volume: "{{volume}}"
pages: "{{pages}}"
issn: "{{ISSN}}"
doi: "{{DOI}}"
intext: "{% if creators | length == 1 %}{{creators[0].lastName}}, {{date | format('YYYY')}}{% elif creators | length == 2 %}{{creators[0].lastName}} & {{creators[1].lastName}}, {{date | format('YYYY')}}{% else %}{{creators[0].lastName}} et al., {{date | format('YYYY')}}{% endif %}"
aliases:
  - "{% if creators | length == 1 %}{{creators[0].lastName}}, {{date | format('YYYY')}}{% elif creators | length == 2 %}{{creators[0].lastName}} & {{creators[1].lastName}}, {{date | format('YYYY')}}{% else %}{{creators[0].lastName}} et al., {{date | format('YYYY')}}{% endif %}"
  - "{% if creators | length == 1 %}{{creators[0].lastName}} {{date | format('YYYY')}}{% elif creators | length == 2 %}{{creators[0].lastName}} and {{creators[1].lastName}} {{date | format('YYYY')}}{% else %}{{creators[0].lastName}} et al. {{date | format('YYYY')}}{% endif %}"
{%- if creators | length > 1 %}
  - "{{creators[0].lastName}} {{date | format('YYYY')}}"
{%- endif %}
{%- if creators | length == 2 %}
  - "{{creators[0].lastName}} & {{creators[1].lastName}} {{date | format('YYYY')}}"
{%- endif %}
zotero: "zotero://select/items/@{{citekey}}"
tags: [literature]
---
# {{title}}
**Authors:** {% for a in creators %}{{a.firstName}} {{a.lastName}}{% if not loop.last %}, {% endif %}{% endfor %}
**Year:** {{date | format('YYYY')}}{% if publicationTitle %} · *{{publicationTitle}}*{% endif %}{% if DOI %} · [DOI](https://doi.org/{{DOI}}){% endif %}
[Open in Zotero](zotero://select/items/@{{citekey}})

**Status:**
{% persist "status" %}{% if isFirstImport %}
#paper/to-read
{% endif %}{% endpersist %}
<!-- one of: #paper/to-read · #paper/fully-read · #paper/referenced · #paper/skimmed
     change with the "Set Reading Status" Templater command, or edit the tag inline.
     Default is gated on isFirstImport (matching the summary/findings persist style) so
     re-imports don't concatenate the default into the preserved content; existing notes
     without a status block are repaired by tp.user.ensureStatusDefault on each refresh. -->

---
## Abstract
<!-- Wrapped in a persist block so manual edits (e.g. when Zotero has no
     abstract and you paste one in) survive re-imports. The default
     content is gated on isFirstImport so re-imports don't concatenate
     into the preserved content; tp.user.ensureAbstract repairs empty
     blocks during Refresh All Literature. -->
{% persist "abstract" %}{% if isFirstImport %}
{% if abstractNote %}{{abstractNote}}{% else %}_No abstract in Zotero — replace this line with your own abstract; it survives re-imports._{% endif %}
{% endif %}{% endpersist %}

---
## Table of contents
<!-- extracted from the PDF bookmarks; refresh with the "Refresh TOC" Templater command -->
{% persist "toc" %}{% if isFirstImport %}
<!-- empty until the first Refresh TOC run -->
{% endif %}{% endpersist %}

---
## Highlights

<!--
Imports Zotero PDF annotations grouped by highlight color:
  Yellow → "General" — claims, facts, useful passages.
  Green  → "Key terms" — important words and phrases to remember.
  Blue   → "Media"    — figures, tables, photos, diagrams worth revisiting.
Each highlight is wrapped in <mark class="hltr-COLOR"> so the
.obsidian/snippets/zotero-highlights.css snippet can tint it to
match the Zotero color. Enable that snippet in
Settings → Appearance → CSS snippets for visible color backgrounds.

To add another color, copy one of the loops below and change both
the colorCategory string AND the mark class. Full list of values:
  Red, Green, Blue, Yellow, Purple, Magenta, Orange, Gray.

This entire section is refreshed from Zotero on every re-import.
Your own notes below survive between %% begin/end %% markers.
-->

### General
{%- for annotation in annotations %}
{%- if annotation.colorCategory == "Yellow" %}
- <mark class="hltr-yellow">{{annotation.annotatedText | replace("\n", " ") | replace("  ", " ") | replace("  ", " ") | trim}}</mark> (p. {{annotation.pageLabel}}){% if annotation.position and annotation.position.rects and annotation.position.rects[0] %} <!-- p={{annotation.position.pageIndex + 1}} y={{annotation.position.rects[0][3]}} -->{% endif %}
{%- if annotation.comment %}
  - *note:* {{annotation.comment | replace("\n", " ") | replace("  ", " ") | replace("  ", " ") | trim}}
{%- endif %}
{%- endif %}
{%- endfor %}

### Key terms
{%- for annotation in annotations %}
{%- if annotation.colorCategory == "Green" %}
- <mark class="hltr-green">{{annotation.annotatedText | replace("\n", " ") | replace("  ", " ") | replace("  ", " ") | trim}}</mark> (p. {{annotation.pageLabel}}){% if annotation.position and annotation.position.rects and annotation.position.rects[0] %} <!-- p={{annotation.position.pageIndex + 1}} y={{annotation.position.rects[0][3]}} -->{% endif %}
{%- if annotation.comment %}
  - *note:* {{annotation.comment | replace("\n", " ") | replace("  ", " ") | replace("  ", " ") | trim}}
{%- endif %}
{%- endif %}
{%- endfor %}

### Media
<!-- figures, tables, photos, diagrams flagged in blue in Zotero -->
{%- for annotation in annotations %}
{%- if annotation.colorCategory == "Blue" %}
- <mark class="hltr-blue">{{annotation.annotatedText | replace("\n", " ") | replace("  ", " ") | replace("  ", " ") | trim}}</mark> (p. {{annotation.pageLabel}}){% if annotation.position and annotation.position.rects and annotation.position.rects[0] %} <!-- p={{annotation.position.pageIndex + 1}} y={{annotation.position.rects[0][3]}} -->{% endif %}
{%- if annotation.comment %}
  - *note:* {{annotation.comment | replace("\n", " ") | replace("  ", " ") | replace("  ", " ") | trim}}
{%- endif %}
{%- endif %}
{%- endfor %}

---
## My summary
<!-- your own words — survives re-imports -->
{% persist "summary" %}{% if isFirstImport %}
- 
{% endif %}{% endpersist %}

## Key findings
{% persist "findings" %}{% if isFirstImport %}
- 
{% endif %}{% endpersist %}

## Connections
<!-- link papers [[other-citekey]] and concepts [[Concept Name]] -->
{% persist "connections" %}{% if isFirstImport %}
- 
{% endif %}{% endpersist %}

## Open questions
{% persist "questions" %}{% if isFirstImport %}
- 
{% endif %}{% endpersist %}

---
## Cited works
<!-- populated by the "Fetch References" Templater command — survives re-imports -->
{% persist "references" %}{% endpersist %}
