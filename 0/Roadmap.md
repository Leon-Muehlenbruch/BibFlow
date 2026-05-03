# Roadmap

High-level timeline for the thesis. Edit the Gantt chart below as dates shift; the milestones list tracks what has actually been completed.

The Mermaid syntax uses `after <id>` to chain dependencies, so changing one start date cascades through the chart. Use `crit,` to flag critical-path items and `milestone,` for zero-duration markers.

```mermaid
gantt
    title Master Thesis Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %Y

    section Research
    Literature review        :active, lit,    2026-05-01, 60d
    Methodology design       :        method, after lit,  30d

    section Experiments
    Lab work                 :        exp,    after method, 90d
    Data analysis            :        ana,    after exp,    45d

    section Writing
    Methods chapter          :        methw,  after method, 60d
    Results chapter          :        resw,   after ana,    45d
    Discussion               :        disw,   after resw,   30d
    Conclusion               :        concw,  after disw,   14d
    Final draft              :crit,   draft,  after concw,  21d

    section Submission
    Submission               :crit, milestone, sub, after draft, 0d
    Defense preparation      :        prep,   after sub,    30d
    Defense                  :crit, milestone, def, after prep, 0d
```

## Milestones

- [ ] Aufgabenstellung signed
- [ ] Literature review complete
- [ ] Methodology approved by supervisor
- [ ] Experiments started
- [ ] First results
- [ ] Methods chapter draft
- [ ] Results chapter draft
- [ ] Discussion chapter draft
- [ ] Full draft sent to supervisor
- [ ] Final revisions complete
- [ ] **Submission**
- [ ] Defense scheduled
- [ ] **Defense**

## Notes

- Start dates of all chained tasks shift automatically when the predecessor moves; no need to recalculate.
- Add or remove sections freely — Mermaid re-renders on every save.
- For finer-grained week-by-week tracking, install the [Tasks plugin](https://obsidian-tasks-group.github.io/obsidian-tasks/) and use `- [ ] task 📅 YYYY-MM-DD` syntax in your daily notes.
