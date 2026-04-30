```dataview
TABLE summary
WHERE contains(file.tags, "#glossary")
WHERE file.name != "Concept Note"
SORT file.name ASC
```
## Dictionary
```dataview
TABLE german-name AS "German", english-name AS "English"
FROM "2 Wiki"
WHERE contains(file.tags, "#glossary")
SORT file.name ASC
```
