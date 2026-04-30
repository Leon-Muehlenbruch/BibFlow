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
zotero: "zotero://select/items/@{{citekey}}"
tags: [literature]
---
# {{title}}
**Authors:** {% for a in creators %}{{a.firstName}} {{a.lastName}}{% if not loop.last %}, {% endif %}{% endfor %}
**Year:** {{date | format('YYYY')}}{% if publicationTitle %} · *{{publicationTitle}}*{% endif %}{% if DOI %} · [DOI](https://doi.org/{{DOI}}){% endif %}
[Open in Zotero](zotero://select/items/@{{citekey}})

---
## Abstract
{% if abstractNote %}{{abstractNote}}{% else %}_No abstract in Zotero._{% endif %}

---
## Highlights

<!--
Imports Zotero PDF annotations grouped by highlight color:
  Yellow → "General" — claims, facts, useful passages.
  Green  → "Key terms" — important words and phrases to remember.
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
- <mark class="hltr-yellow">{{annotation.annotatedText}}</mark> (p. {{annotation.pageLabel}})
{%- if annotation.comment %}
  - *note:* {{annotation.comment}}
{%- endif %}
{%- endif %}
{%- endfor %}

### Key terms
{%- for annotation in annotations %}
{%- if annotation.colorCategory == "Green" %}
- <mark class="hltr-green">{{annotation.annotatedText}}</mark> (p. {{annotation.pageLabel}})
{%- if annotation.comment %}
  - *note:* {{annotation.comment}}
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
