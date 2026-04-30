const { Plugin, MarkdownView, setIcon } = require("obsidian");

module.exports = class ModeSwitcher extends Plugin {
  async onload() {
    console.log("ModeSwitcher: loading");
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.addButtons())
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.addButtons())
    );
    this.app.workspace.onLayoutReady(() => this.addButtons());
  }

  addButtons() {
    try {
      const leaves = this.app.workspace.getLeavesOfType("markdown");
      console.log("ModeSwitcher: found", leaves.length, "markdown leaves");

      for (const leaf of leaves) {
        const view = leaf.view;
        if (!(view instanceof MarkdownView)) continue;

        const actionsEl =
          view.containerEl.querySelector(".view-actions") ||
          view.containerEl.querySelector(".view-header-nav-buttons-container") ||
          view.containerEl.querySelector(".view-header");

        if (!actionsEl) {
          console.log("ModeSwitcher: no actions container found");
          continue;
        }
        console.log("ModeSwitcher: injecting into", actionsEl.className);

        if (actionsEl.querySelector(".mode-switcher-group")) continue;

        const group = document.createElement("div");
        group.className = "mode-switcher-group";

        const modes = [
          { id: "reading", label: "Reading view", icon: "book-open",
            apply: (s) => Object.assign({}, s, { mode: "preview" }) },
          { id: "live", label: "Live Preview", icon: "pencil",
            apply: (s) => Object.assign({}, s, { mode: "source", source: false }) },
          { id: "source", label: "Source mode", icon: "code",
            apply: (s) => Object.assign({}, s, { mode: "source", source: true }) },
        ];

        for (const m of modes) {
          const btn = document.createElement("button");
          btn.className = "mode-switcher-btn mode-" + m.id;
          btn.setAttribute("aria-label", m.label);
          try { setIcon(btn, m.icon); } catch (e) { btn.textContent = m.label; }
          btn.onclick = async () => {
            const state = leaf.view.getState();
            await leaf.setViewState({ type: "markdown", state: m.apply(state) });
            this.updateActive(group, leaf);
          };
          group.appendChild(btn);
        }

        actionsEl.prepend(group);
        console.log("ModeSwitcher: appended group");
        this.updateActive(group, leaf);
      }
    } catch (err) {
      console.error("ModeSwitcher addButtons error:", err);
    }
  }

  updateActive(group, leaf) {
    const state = leaf.view.getState();
    group.querySelectorAll(".mode-switcher-btn").forEach((b) =>
      b.classList.remove("is-active")
    );
    let activeClass;
    if (state.mode === "preview") activeClass = ".mode-reading";
    else if (state.source) activeClass = ".mode-source";
    else activeClass = ".mode-live";
    const el = group.querySelector(activeClass);
    if (el) el.classList.add("is-active");
  }
};