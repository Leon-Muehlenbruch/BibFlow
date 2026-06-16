/* Card Toggle Panel — Obsidian plugin
   Sidebar view that lists every card in the active Canvas with
   a toggle checkbox to hide/show it and its edges. */

const { Plugin, ItemView, Modal, setIcon } = require("obsidian");

class WorkspaceModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("ctp-workspace-modal");
    contentEl.createEl("h2", { text: "Cleanup & Design", cls: "ctp-modal-title" });

    const ws = this.app.workspace;
    const rightCount = this.plugin.countLeavesIn(ws.rightSplit);
    const mainCount = this.plugin.countLeavesIn(ws.rootSplit);
    const leftCount = this.plugin.countLeavesIn(ws.leftSplit);

    const section = (label) =>
      contentEl.createDiv({ cls: "ctp-modal-section", text: label });

    const makeRow = (icon, label, suffix, onClick, danger = false) => {
      const btn = contentEl.createEl("button", { cls: "ctp-modal-btn" });
      if (danger) btn.classList.add("ctp-danger");
      const iconEl = btn.createSpan({ cls: "ctp-modal-icon" });
      setIcon(iconEl, icon);
      btn.createSpan({ text: label, cls: "ctp-modal-label" });
      if (suffix !== null && suffix !== undefined) {
        btn.createSpan({ text: suffix, cls: "ctp-modal-count" });
      }
      btn.addEventListener("click", () => {
        onClick();
        this.close();
      });
      return btn;
    };

    // ─── SIDEBARS ───
    section("Sidebars");
    makeRow("panel-left", "Toggle left sidebar", null,
      () => this.app.commands.executeCommandById("app:toggle-left-sidebar"));
    makeRow("panel-right", "Toggle right sidebar", null,
      () => this.app.commands.executeCommandById("app:toggle-right-sidebar"));

    // ─── CLOSE TABS ───
    section("Close tabs");
    makeRow("panel-right-close", "Right sidebar", `(${rightCount})`,
      () => this.plugin.closeLeavesIn(ws.rightSplit));
    makeRow("x-square", "Main area", `(${mainCount})`,
      () => this.plugin.closeLeavesIn(ws.rootSplit), true);
    makeRow("panel-left-close", "Left sidebar", `(${leftCount})`,
      () => this.plugin.closeLeavesIn(ws.leftSplit));
    makeRow("link", "Keep only links in right sidebar", null,
      () => this.plugin.resetRightSidebarToLinks());

    // Cancel
    const cancel = contentEl.createEl("button", { text: "Cancel", cls: "ctp-modal-btn ctp-modal-cancel" });
    cancel.addEventListener("click", () => this.close());
  }

  onClose() {
    this.contentEl.empty();
  }
}

const VIEW_TYPE = "card-toggle-panel";

const COLOR_MAP = {
  "1": "#e74c3c",
  "2": "#e67e22",
  "3": "#f1c40f",
  "4": "#27ae60",
  "5": "#3498db",
  "6": "#9b59b6"
};

class CardTogglePanelView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.hiddenIds = new Set();
    this.filterText = "";
    this.isolatedGroupId = null;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Card Toggle Panel"; }
  getIcon() { return "eye"; }

  async onOpen() {
    this.render();
    // Refresh when the user switches to another canvas
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.render())
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.render())
    );
  }

  getActiveCanvas() {
    const leaf = this.app.workspace.activeLeaf;
    if (!leaf || !leaf.view) return null;
    if (leaf.view.getViewType && leaf.view.getViewType() !== "canvas") {
      // Fallback: scan all leaves for a canvas view
      const canvasLeaves = this.app.workspace.getLeavesOfType("canvas");
      if (canvasLeaves.length === 0) return null;
      return canvasLeaves[0].view.canvas;
    }
    return leaf.view.canvas || null;
  }

  toggleNode(canvas, nodeId, show) {
    const node = canvas.nodes.get(nodeId);
    if (!node || !node.nodeEl) return;
    if (show) {
      node.nodeEl.classList.remove("ctp-hidden");
      this.hiddenIds.delete(nodeId);
    } else {
      node.nodeEl.classList.add("ctp-hidden");
      this.hiddenIds.add(nodeId);
    }
    this.refreshEdgeVisibility(canvas);
  }

  refreshEdgeVisibility(canvas) {
    if (!canvas?.edges) return;

    const getEdgeNodeId = (edge, side) => {
      const direct = edge[side + "Node"];
      if (typeof direct === "string") return direct;
      const sideObj = edge[side];
      if (typeof sideObj === "string") return sideObj;
      return sideObj?.node?.id || sideObj?.id || null;
    };

    const setHidden = (el, hidden) => {
      if (!el || !el.style) return;
      if (hidden) {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
        el.style.setProperty("pointer-events", "none", "important");
      } else {
        el.style.removeProperty("display");
        el.style.removeProperty("visibility");
        el.style.removeProperty("opacity");
        el.style.removeProperty("pointer-events");
      }
    };

    // Step 1: Hide / show each edge's SVG (line + arrow)
    canvas.edges.forEach((edge) => {
      const fromId = getEdgeNodeId(edge, "from");
      const toId = getEdgeNodeId(edge, "to");
      const shouldHide =
        (fromId && this.hiddenIds.has(fromId)) ||
        (toId && this.hiddenIds.has(toId));

      [
        edge.lineGroupEl,
        edge.lineEndGroupEl,
        edge.labelEl,
        edge.label,
        edge.pathLabelEl,
        edge.path,
        edge.bezier,
        edge.line,
        edge.el,
        edge.containerEl
      ].forEach((el) => setHidden(el, shouldHide));
    });

    // Step 2: Brute-force handle floating HTML labels.
    // Strategy: hide ALL .canvas-path-label-wrapper / .canvas-path-label
    // in the canvas container, then re-show only those whose edge
    // endpoints are both visible (we walk siblings of each edge's
    // lineGroupEl to find its associated label).
    const canvasContainer =
      canvas.canvasEl ||
      canvas.containerEl?.querySelector?.(".canvas") ||
      canvas.wrapperEl;
    if (!canvasContainer) return;

    const allLabels = canvasContainer.querySelectorAll(
      ".canvas-path-label-wrapper, .canvas-path-label"
    );
    allLabels.forEach((el) => setHidden(el, true));

    // For each edge that should be visible, try to find its label and show it
    canvas.edges.forEach((edge) => {
      const fromId = getEdgeNodeId(edge, "from");
      const toId = getEdgeNodeId(edge, "to");
      const shouldShow =
        !(fromId && this.hiddenIds.has(fromId)) &&
        !(toId && this.hiddenIds.has(toId));
      if (!shouldShow) return;

      // Only Method A: explicit property on the edge.
      // A reliable sibling/DOM-walk doesn't exist because all labels
      // live in the same parent container — so we'd re-show too many.
      const directLabel = edge.labelEl || edge.label || edge.pathLabelEl;
      if (directLabel && typeof directLabel === "object" && directLabel.style) {
        setHidden(directLabel, false);
        const wrap = directLabel.closest?.(".canvas-path-label-wrapper");
        if (wrap) setHidden(wrap, false);
      }
    });
  }

  showAll(canvas) {
    this.hiddenIds.clear();
    this.isolatedGroupId = null;
    this.isolatedNodeId = null;
    canvas.nodes.forEach((node) => node.nodeEl?.classList.remove("ctp-hidden"));
    // Use refreshEdgeVisibility which now removes all hide-properties
    this.refreshEdgeVisibility(canvas);
    this.render();
  }

  // ============================================================
  // Isolate: show only a set of starting nodes + their direct
  // connections (and the parent groups containing them).
  // ============================================================
  isolateFromIds(canvas, startIds) {
    const bboxOf = (n) => {
      const d = n.getData ? n.getData() : n;
      return { x: d.x, y: d.y, w: d.width, h: d.height };
    };
    const contains = (outer, inner) =>
      outer.x <= inner.x &&
      outer.x + outer.w >= inner.x + inner.w &&
      outer.y <= inner.y &&
      outer.y + outer.h >= inner.y + inner.h;

    // Connected nodes (1-hop neighbours)
    const connectedIds = new Set(startIds);
    canvas.edges.forEach((edge) => {
      const fromId = edge.from?.node?.id || edge.fromNode;
      const toId = edge.to?.node?.id || edge.toNode;
      if (startIds.has(fromId)) connectedIds.add(toId);
      if (startIds.has(toId)) connectedIds.add(fromId);
    });

    // Include smallest parent group of each non-group node for visual context
    const allGroupEntries = Array.from(canvas.nodes.entries()).filter(([_, n]) => {
      const d = n.getData ? n.getData() : n;
      return d.type === "group";
    });
    const findParentGroup = (nodeBbox, excludeId) => {
      let bestId = null;
      let bestArea = Infinity;
      for (const [gId, gNode] of allGroupEntries) {
        if (gId === excludeId) continue;
        const gBb = bboxOf(gNode);
        if (contains(gBb, nodeBbox)) {
          const area = gBb.w * gBb.h;
          if (area < bestArea) {
            bestArea = area;
            bestId = gId;
          }
        }
      }
      return bestId;
    };

    const finalVisible = new Set(connectedIds);
    connectedIds.forEach((id) => {
      const node = canvas.nodes.get(id);
      if (!node) return;
      const data = node.getData ? node.getData() : node;
      if (data.type === "group") return;
      const parentId = findParentGroup(bboxOf(node), id);
      if (parentId) finalVisible.add(parentId);
    });

    // Apply: hide everything not in finalVisible
    this.hiddenIds = new Set();
    canvas.nodes.forEach((node, id) => {
      if (finalVisible.has(id)) {
        node.nodeEl?.classList.remove("ctp-hidden");
      } else {
        node.nodeEl?.classList.add("ctp-hidden");
        this.hiddenIds.add(id);
      }
    });
    this.refreshEdgeVisibility(canvas);
    this.render();
  }

  isolateNode(canvas, nodeId) {
    this.isolatedNodeId = nodeId;
    this.isolatedGroupId = null;
    this.isolateFromIds(canvas, new Set([nodeId]));
  }

  isolateGroup(canvas, groupId) {
    this.isolatedGroupId = groupId;
    this.isolatedNodeId = null;
    const groupNode = canvas.nodes.get(groupId);
    if (!groupNode) return;
    const groupData = groupNode.getData ? groupNode.getData() : groupNode;
    const gBox = { x: groupData.x, y: groupData.y, w: groupData.width, h: groupData.height };
    const inGroupIds = new Set([groupId]);
    canvas.nodes.forEach((node, id) => {
      if (id === groupId) return;
      const d = node.getData ? node.getData() : node;
      if (gBox.x <= d.x && gBox.x + gBox.w >= d.x + d.width &&
          gBox.y <= d.y && gBox.y + gBox.h >= d.y + d.height) {
        inGroupIds.add(id);
      }
    });
    this.isolateFromIds(canvas, inGroupIds);
  }

  clearIsolation(canvas) {
    this.isolatedGroupId = null;
    this.isolatedNodeId = null;
    this.showAll(canvas);
  }

  hideAll(canvas) {
    this.hiddenIds.clear();
    canvas.nodes.forEach((node, id) => {
      node.nodeEl?.classList.add("ctp-hidden");
      this.hiddenIds.add(id);
    });
    this.refreshEdgeVisibility(canvas);
    this.render();
  }

  invertAll(canvas) {
    const newHidden = new Set();
    canvas.nodes.forEach((node, id) => {
      if (this.hiddenIds.has(id)) {
        node.nodeEl?.classList.remove("ctp-hidden");
      } else {
        node.nodeEl?.classList.add("ctp-hidden");
        newHidden.add(id);
      }
    });
    this.hiddenIds = newHidden;
    this.refreshEdgeVisibility(canvas);
    this.render();
  }

  nodeDisplayLabel(node) {
    const data = node.getData ? node.getData() : node;
    // Group nodes have label
    if (data.type === "group") return data.label || "(unlabeled group)";
    // Text nodes have text — extract just the title (first line / heading)
    if (data.type === "text") {
      const txt = data.text || "";
      // First non-empty line
      const lines = txt.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      let first = lines[0] || "";
      // Strip leading heading markers (#, ##, etc)
      first = first.replace(/^#+\s*/, "");
      // Resolve wikilinks: [[X|Y]] → Y, [[X]] → X
      first = first.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
      first = first.replace(/\[\[([^\]]+)\]\]/g, "$1");
      // Strip bold / italic markers
      first = first.replace(/\*\*([^*]+)\*\*/g, "$1");
      first = first.replace(/_\_([^_]+)\_\_/g, "$1");
      first = first.replace(/\*([^*]+)\*/g, "$1");
      first = first.replace(/_([^_]+)_/g, "$1");
      return first.trim() || "(empty card)";
    }
    // File nodes
    if (data.type === "file") return data.file || data.id;
    return data.id;
  }

  // Bulk toggle a specific set of node IDs
  toggleNodeSet(canvas, nodeIds, show) {
    nodeIds.forEach((id) => {
      const node = canvas.nodes.get(id);
      if (!node || !node.nodeEl) return;
      if (show) {
        node.nodeEl.classList.remove("ctp-hidden");
        this.hiddenIds.delete(id);
      } else {
        node.nodeEl.classList.add("ctp-hidden");
        this.hiddenIds.add(id);
      }
    });
    this.refreshEdgeVisibility(canvas);
    this.render();
  }

  render() {
    const container = this.contentEl;
    container.empty();
    container.addClass("ctp-container");

    const canvas = this.getActiveCanvas();
    if (!canvas) {
      container.createDiv({ cls: "ctp-empty", text: "Open a Canvas to use this panel." });
      return;
    }

    // Header
    const header = container.createDiv({ cls: "ctp-header" });
    header.createDiv({ cls: "ctp-title", text: "Card Toggle Panel" });
    const actions = header.createDiv({ cls: "ctp-actions" });

    const showAllBtn = actions.createEl("button", { cls: "ctp-btn", text: "Show all" });
    showAllBtn.addEventListener("click", () => this.showAll(canvas));

    const hideAllBtn = actions.createEl("button", { cls: "ctp-btn", text: "Hide all" });
    hideAllBtn.addEventListener("click", () => this.hideAll(canvas));

    const invertBtn = actions.createEl("button", { cls: "ctp-btn", text: "Invert" });
    invertBtn.addEventListener("click", () => this.invertAll(canvas));

    // Isolation status banner (when active)
    if (this.isolatedNodeId || this.isolatedGroupId) {
      const banner = container.createDiv({ cls: "ctp-isolate-banner" });
      const isolatedNode = canvas.nodes.get(this.isolatedNodeId || this.isolatedGroupId);
      const isolatedName = isolatedNode ? this.nodeDisplayLabel(isolatedNode) : "?";
      banner.createDiv({ cls: "ctp-isolate-banner-label", text: `Isolated: ${isolatedName}` });
      const clearBtn = banner.createEl("button", { cls: "ctp-btn", text: "Clear" });
      clearBtn.addEventListener("click", () => this.clearIsolation(canvas));
    }

    // Filter
    const filter = container.createEl("input", {
      cls: "ctp-filter",
      type: "text",
      placeholder: "Filter cards…"
    });
    filter.value = this.filterText;
    filter.addEventListener("input", () => {
      this.filterText = filter.value.toLowerCase();
      this.renderList(container, canvas);
      // re-focus filter after re-render
      const f = container.querySelector(".ctp-filter");
      if (f) {
        f.focus();
        f.setSelectionRange(this.filterText.length, this.filterText.length);
      }
    });

    this.renderList(container, canvas);
  }

  renderList(container, canvas) {
    // Remove old list
    const existing = container.querySelector(".ctp-list");
    if (existing) existing.remove();

    const list = container.createDiv({ cls: "ctp-list" });

    // Sort: groups first, then by label
    const allNodes = Array.from(canvas.nodes.entries());

    // Sync hidden state from DOM (in case canvas reloaded)
    this.hiddenIds = new Set();
    allNodes.forEach(([id, node]) => {
      if (node.nodeEl?.classList.contains("ctp-hidden")) {
        this.hiddenIds.add(id);
      }
    });

    const groupsRaw = allNodes.filter(([_, n]) => {
      const d = n.getData ? n.getData() : n;
      return d.type === "group";
    });
    const cards = allNodes.filter(([_, n]) => {
      const d = n.getData ? n.getData() : n;
      return d.type !== "group";
    });

    // Split groups into top-level vs nested (subgroups).
    // A group is "nested" if its bbox sits entirely inside another group's bbox.
    const bbox = (n) => {
      const d = n.getData ? n.getData() : n;
      return { x: d.x, y: d.y, w: d.width, h: d.height };
    };
    const contains = (outer, inner) =>
      outer.x <= inner.x &&
      outer.x + outer.w >= inner.x + inner.w &&
      outer.y <= inner.y &&
      outer.y + outer.h >= inner.y + inner.h;

    const groupBoxes = groupsRaw.map(([id, n]) => ({ id, node: n, box: bbox(n) }));
    const topGroups = [];
    const subGroups = [];
    groupBoxes.forEach(({ id, node, box }) => {
      const isNested = groupBoxes.some(
        (other) => other.id !== id && contains(other.box, box)
      );
      if (isNested) subGroups.push([id, node]);
      else topGroups.push([id, node]);
    });

    const matchesFilter = (node) => {
      if (!this.filterText) return true;
      const data = node.getData ? node.getData() : node;
      const haystack = [
        data.text || "",
        data.label || "",
        this.nodeDisplayLabel(node)
      ].join(" ").toLowerCase();
      return haystack.includes(this.filterText);
    };

    // Highlight matching cards on the canvas (or clear if no filter)
    canvas.nodes.forEach((node) => {
      if (!node.nodeEl) return;
      if (this.filterText && matchesFilter(node)) {
        node.nodeEl.classList.add("ctp-match");
      } else {
        node.nodeEl.classList.remove("ctp-match");
      }
    });

    const renderSection = (title, entries) => {
      const filtered = entries.filter(([_, node]) => matchesFilter(node));
      if (filtered.length === 0) return;

      // Section header with master toggle
      const sectionHeader = list.createDiv({ cls: "ctp-section-header" });

      // Determine master state: all on / all off / mixed
      const hiddenCount = filtered.filter(([id]) => this.hiddenIds.has(id)).length;
      const allHidden = hiddenCount === filtered.length;
      const allVisible = hiddenCount === 0;

      const masterCb = sectionHeader.createEl("input", { cls: "ctp-section-master", type: "checkbox" });
      masterCb.checked = !allHidden;
      masterCb.indeterminate = !allHidden && !allVisible;
      masterCb.title = `Toggle all ${title.toLowerCase()}`;

      const ids = filtered.map(([id]) => id);
      masterCb.addEventListener("change", (e) => {
        e.stopPropagation();
        // If currently all visible → hide all. Otherwise → show all.
        const showAll = !allVisible || masterCb.checked;
        this.toggleNodeSet(canvas, ids, showAll);
      });

      const sectionLabel = sectionHeader.createDiv({
        cls: "ctp-section-label",
        text: `${title} (${filtered.length})`
      });
      sectionLabel.addEventListener("click", () => {
        masterCb.click();
      });

      filtered.forEach(([id, node]) => this.renderRow(list, canvas, id, node));
    };

    renderSection("Top categories", topGroups);
    renderSection("Subcategories", subGroups);
    renderSection("Cards", cards);

    if (list.childElementCount === 0) {
      list.createDiv({ cls: "ctp-empty", text: "No cards match your filter." });
    }
  }

  renderRow(list, canvas, id, node) {
    const data = node.getData ? node.getData() : node;
    const isHidden = this.hiddenIds.has(id);

    const row = list.createDiv({ cls: "ctp-row" + (isHidden ? " is-hidden" : "") });

    // Checkbox
    const cb = row.createEl("input", { cls: "ctp-checkbox", type: "checkbox" });
    cb.checked = !isHidden;
    cb.addEventListener("change", (e) => {
      e.stopPropagation();
      this.toggleNode(canvas, id, cb.checked);
      row.toggleClass("is-hidden", !cb.checked);
    });

    // Color swatch
    const swatch = row.createDiv({ cls: "ctp-swatch" });
    swatch.style.background = COLOR_MAP[data.color] || "transparent";

    // Label (also clickable to toggle)
    const label = row.createDiv({ cls: "ctp-label", text: this.nodeDisplayLabel(node) });
    label.addEventListener("click", () => {
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event("change"));
    });

    // Double-click on label centers the canvas on the node
    label.addEventListener("dblclick", (e) => {
      e.preventDefault();
      if (canvas.zoomToBbox && node.bbox) {
        canvas.zoomToBbox(node.bbox);
      } else if (canvas.zoomToSelection) {
        canvas.deselectAll?.();
        canvas.select?.(node);
        canvas.zoomToSelection();
      }
    });

    // Isolate button — only for non-group cards
    if (data.type !== "group") {
      const isoBtn = row.createEl("button", { cls: "ctp-row-isolate", attr: { "aria-label": "Isolate this card and its connections" } });
      setIcon(isoBtn, "focus");
      isoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.isolateNode(canvas, id);
      });
    }
  }

  async onClose() {}
}

module.exports = class CardTogglePanelPlugin extends Plugin {
  async onload() {
    this.registerView(VIEW_TYPE, (leaf) => new CardTogglePanelView(leaf, this));

    // Single ribbon button — opens the consolidated workspace modal
    this.addRibbonIcon("wand-sparkles", "Cleanup & Design", () => {
      new WorkspaceModal(this.app, this).open();
    });

    this.addCommand({
      id: "ctp-workspace-modal",
      name: "Cleanup & Design (open modal)",
      callback: () => new WorkspaceModal(this.app, this).open()
    });
    this.addCommand({
      id: "ctp-close-right-sidebar",
      name: "Close all right sidebar tabs",
      callback: () => this.closeLeavesIn(this.app.workspace.rightSplit)
    });
    this.addCommand({
      id: "ctp-close-main",
      name: "Close all main area tabs",
      callback: () => this.closeLeavesIn(this.app.workspace.rootSplit)
    });
    this.addCommand({
      id: "ctp-close-left-sidebar",
      name: "Close all left sidebar tabs",
      callback: () => this.closeLeavesIn(this.app.workspace.leftSplit)
    });

    this.addCommand({
      id: "open-card-toggle-panel",
      name: "Open Card Toggle Panel",
      callback: () => this.activateView()
    });

    this.addCommand({
      id: "ctp-show-all",
      name: "Show all cards (Card Toggle Panel)",
      callback: () => {
        const view = this.getView();
        const canvas = view?.getActiveCanvas() || this.getActiveCanvas();
        if (canvas) (view || this).showAll?.(canvas);
      }
    });

    this.addCommand({
      id: "ctp-hide-all",
      name: "Hide all cards (Card Toggle Panel)",
      callback: () => {
        const view = this.getView();
        const canvas = view?.getActiveCanvas() || this.getActiveCanvas();
        if (canvas) (view || this).hideAll?.(canvas);
      }
    });

    this.addCommand({
      id: "ctp-open-legend",
      name: "Open Faction Map Legend",
      callback: () => this.openLegendNote()
    });

    this.addCommand({
      id: "ctp-toggle-legend-card",
      name: "Toggle legend card on canvas",
      callback: () => this.toggleLegend()
    });

    // Inject custom buttons into canvas controls (the floating right toolbar)
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.injectCanvasButtons())
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.injectCanvasButtons())
    );
    // Initial attempt (canvas may not be ready immediately on plugin load)
    this.app.workspace.onLayoutReady(() => {
      this.injectCanvasButtons();
      // Make sure the file explorer is present in the left sidebar
      this.ensureLeftSidebar();
      // Auto-clean right sidebar on session start — only the specific noise tabs
      setTimeout(() => {
        this.resetRightSidebarToLinks();
        // Default sidebar state on startup: left expanded, right collapsed
        this.setSidebarState(true, false);
      }, 1200);
    });
    setTimeout(() => this.injectCanvasButtons(), 600);

    // Also expose a manual command to restore the left sidebar
    this.addCommand({
      id: "ctp-restore-left-sidebar",
      name: "Restore left sidebar (file explorer)",
      callback: () => this.ensureLeftSidebar()
    });
  }

  getActiveCanvas() {
    const leaf = this.app.workspace.activeLeaf;
    if (leaf?.view?.getViewType?.() === "canvas") {
      return leaf.view.canvas;
    }
    const leaves = this.app.workspace.getLeavesOfType("canvas");
    return leaves[0]?.view?.canvas || null;
  }

  // ============================================================
  // Tab cleanup helpers
  // ============================================================
  countLeavesIn(split) {
    if (!split) return 0;
    let n = 0;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.getRoot && leaf.getRoot() === split) n++;
    });
    return n;
  }

  closeLeavesIn(split) {
    if (!split) return;
    const leaves = [];
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.getRoot && leaf.getRoot() === split) leaves.push(leaf);
    });
    leaves.forEach((leaf) => leaf.detach());
  }

  resetRightSidebarToLinks() {
    const ws = this.app.workspace;
    const right = ws.rightSplit;
    if (!right) return;

    // SAFE-by-default whitelist of view types we close from the right sidebar.
    // We never touch anything not on this list — protects file-explorer/search/bookmarks etc.
    const CLOSE_TYPES = new Set([
      "tag",
      "outline",
      "DICE_ROLLER_VIEW",
      "juggl_nodes",
      "juggl_style",
      "card-toggle-panel"
    ]);

    ws.iterateAllLeaves((leaf) => {
      const type = leaf.view?.getViewType?.();
      if (!type || !CLOSE_TYPES.has(type)) return;
      // Belt-and-suspenders: only close if it's actually in the right sidebar
      const leafRoot = leaf.getRoot?.();
      if (leafRoot !== right) return;
      leaf.detach();
    });
  }

  setSidebarState(leftExpanded, rightExpanded) {
    const ws = this.app.workspace;
    const left = ws.leftSplit;
    const right = ws.rightSplit;
    // .expand() / .collapse() are the Obsidian Sidedock methods
    if (left) {
      if (leftExpanded && left.collapsed && left.expand) left.expand();
      else if (!leftExpanded && !left.collapsed && left.collapse) left.collapse();
    }
    if (right) {
      if (rightExpanded && right.collapsed && right.expand) right.expand();
      else if (!rightExpanded && !right.collapsed && right.collapse) right.collapse();
    }
  }

  async ensureLeftSidebar() {
    const ws = this.app.workspace;
    // If a file-explorer view is already open somewhere, do nothing
    const existing = ws.getLeavesOfType("file-explorer");
    if (existing.length > 0) return;
    // Open one in the left sidebar
    const leaf = ws.getLeftLeaf(false);
    if (!leaf) return;
    await leaf.setViewState({ type: "file-explorer", active: true });
    ws.revealLeaf(leaf);
  }

  toggleLegend() {
    const canvas = this.getActiveCanvas();
    if (!canvas) return;
    const legend = canvas.nodes.get("legend");
    if (!legend || !legend.nodeEl) return;
    legend.nodeEl.classList.toggle("ctp-hidden");
  }

  LEGEND_PATH = "1 Lore/Waterdeep Faction Map Legend.md";

  findLegendLeaf() {
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    return leaves.find((l) => l.view?.file?.path === this.LEGEND_PATH) || null;
  }

  async toggleLegendNote() {
    const existing = this.findLegendLeaf();
    if (existing) {
      existing.detach();
    } else {
      const file = this.app.vault.getAbstractFileByPath(this.LEGEND_PATH);
      if (!file) {
        console.warn(`Card Toggle Panel: legend note not found at ${this.LEGEND_PATH}`);
        return;
      }
      const leaf = this.app.workspace.getRightLeaf(false);
      await leaf.openFile(file);
      this.app.workspace.revealLeaf(leaf);
    }
    this.updateLegendButtonState();
  }

  // Backwards-compat alias
  async openLegendNote() {
    return this.toggleLegendNote();
  }

  updateLegendButtonState() {
    const isOpen = !!this.findLegendLeaf();
    document.querySelectorAll('.ctp-canvas-btn[data-ctp-action="legend"]').forEach((btn) => {
      btn.classList.toggle("is-active", isOpen);
    });
  }

  injectCanvasButtons() {
    const leaves = this.app.workspace.getLeavesOfType("canvas");
    leaves.forEach((leaf) => {
      const containerEl = leaf.view?.containerEl;
      if (!containerEl) return;
      const controls = containerEl.querySelector(".canvas-controls");
      if (!controls) return;
      // Don't inject twice
      if (controls.querySelector(".ctp-canvas-btn")) return;

      // Clone native classes so we match whatever Obsidian's current version uses.
      // Each native control is its own group (one button per group), so we mirror that:
      // prepend two separate group elements, each containing one button.
      const nativeGroup = controls.querySelector(":scope > div");
      const nativeItem = nativeGroup?.querySelector(":scope > div");

      const makeGroup = (icon, label, action, onClick) => {
        const group = document.createElement("div");
        group.className = nativeGroup ? nativeGroup.className : "canvas-controls-group";
        group.classList.add("ctp-canvas-group");

        const btn = document.createElement("div");
        btn.className = nativeItem ? nativeItem.className : "canvas-control-item clickable-icon";
        btn.classList.add("ctp-canvas-btn");
        btn.setAttribute("data-ctp-action", action);
        setIcon(btn, icon);
        btn.setAttribute("aria-label", label);
        btn.addEventListener("click", onClick);

        group.appendChild(btn);
        return group;
      };

      const eyeGroup = makeGroup("eye", "Toggle Card Toggle Panel", "panel", () => this.activateView());
      const legendGroup = makeGroup("book-open", "Toggle legend (in right sidebar)", "legend", () => this.toggleLegendNote());

      // Prepend in reverse order so eye is on top
      controls.prepend(legendGroup);
      controls.prepend(eyeGroup);
    });

    // Sync button states on every injection pass too
    this.updateLegendButtonState();
    this.updatePanelButtonState();
  }

  getView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    if (leaves.length > 0) return leaves[0].view;
    return null;
  }

  async activateView() {
    // Toggle behavior: close if already open, otherwise open + reveal
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE)[0];

    if (existing) {
      existing.detach();
      this.updatePanelButtonState();
      return;
    }

    const leaf = workspace.getRightLeaf(false);
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);
    this.updatePanelButtonState();
  }

  updatePanelButtonState() {
    const isOpen = this.app.workspace.getLeavesOfType(VIEW_TYPE).length > 0;
    document.querySelectorAll('.ctp-canvas-btn[data-ctp-action="panel"]').forEach((btn) => {
      btn.classList.toggle("is-active", isOpen);
    });
  }

  showAll(canvas) {
    // Delegate to view if present, otherwise minimal direct implementation
    const view = this.getView();
    if (view) return view.showAll(canvas);
    canvas.nodes.forEach((node) => node.nodeEl?.classList.remove("ctp-hidden"));
    canvas.edges.forEach((edge) => {
      edge.lineGroupEl?.classList.remove("ctp-hidden");
      edge.lineEndGroupEl?.classList.remove("ctp-hidden");
    });
  }

  hideAll(canvas) {
    const view = this.getView();
    if (view) return view.hideAll(canvas);
    canvas.nodes.forEach((node) => node.nodeEl?.classList.add("ctp-hidden"));
    canvas.edges.forEach((edge) => {
      edge.lineGroupEl?.classList.add("ctp-hidden");
      edge.lineEndGroupEl?.classList.add("ctp-hidden");
    });
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
    // Clean up injected buttons
    document.querySelectorAll(".ctp-canvas-group").forEach((el) => el.remove());
  }
};
