'use strict';

// Ribbon Cleaner — keep only an allowlist of left-ribbon icons visible.
//
// Why a plugin: hiding ribbon icons reproducibly can't be done by editing
// config blind, because the icons are matched by their aria-label (tooltip)
// and those labels live in minified plugin code. This plugin runs at runtime
// where the real labels exist, hides everything not on the allowlist, and
// stores the allowlist in data.json — so the curated ribbon ships to any vault.

const { Plugin, PluginSettingTab, Setting, debounce } = require('obsidian');

const DEFAULT_SETTINGS = {
  // aria-labels (tooltips) of left-ribbon icons to KEEP visible. Every other
  // registered ribbon item is hidden. System buttons (the settings gear etc.)
  // are never affected — they are not ribbon "items".
  keep: [
    'Templater: Insert Launcher',
    'Insert Template',
    'Open graph view',
    'Cleanup & Design',
  ],
};

const STYLE_ID = 'ribbon-cleaner-style';

module.exports = class RibbonCleanerPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.styleEl = document.head.createEl('style', { attr: { id: STYLE_ID } });
    this.apply = debounce(() => this.curate(), 100, true);

    this.app.workspace.onLayoutReady(() => {
      this.curate();
      this.observeRibbon();
      // Some plugins register their ribbon icon a little after layout-ready.
      const tid = window.setTimeout(() => this.curate(), 1500);
      this.register(() => window.clearTimeout(tid));
    });
    this.registerEvent(this.app.workspace.on('layout-change', () => this.apply()));

    this.addSettingTab(new RibbonCleanerSettingTab(this.app, this));
  }

  onunload() {
    this.styleEl?.remove();
    this.observer?.disconnect();
  }

  // Titles (aria-labels) of all registered left-ribbon items — excludes
  // system buttons, which are not part of workspace.leftRibbon.items.
  ribbonTitles() {
    const lr = this.app.workspace.leftRibbon;
    const items = lr && Array.isArray(lr.items) ? lr.items : [];
    const titles = items
      .map((i) => i && (i.title || i.ariaLabel))
      .filter((t) => typeof t === 'string' && t.length > 0);
    return [...new Set(titles)];
  }

  observeRibbon() {
    const container = document.querySelector('.workspace-ribbon.mod-left');
    if (!container || this.observer) return;
    this.observer = new MutationObserver(() => this.apply());
    this.observer.observe(container, { childList: true, subtree: true });
  }

  curate() {
    const keep = new Set(this.settings.keep);
    const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const css = this.ribbonTitles()
      .filter((t) => !keep.has(t))
      .map(
        (t) =>
          `.workspace-ribbon.mod-left .side-dock-ribbon-action[aria-label="${esc(t)}"]{display:none !important;}`
      )
      .join('\n');
    if (this.styleEl) this.styleEl.textContent = css;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.curate();
  }
};

class RibbonCleanerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('p', {
      text: 'Pick which left-ribbon icons stay visible. Everything else is hidden. System buttons (settings gear, etc.) are never touched.',
    });

    const titles = this.plugin.ribbonTitles();
    if (titles.length === 0) {
      containerEl.createEl('p', {
        text: 'No ribbon items detected — reopen this tab after a reload.',
      });
      return;
    }

    const keep = new Set(this.plugin.settings.keep);
    for (const title of titles) {
      new Setting(containerEl).setName(title).addToggle((t) =>
        t.setValue(keep.has(title)).onChange(async (v) => {
          const set = new Set(this.plugin.settings.keep);
          if (v) set.add(title);
          else set.delete(title);
          this.plugin.settings.keep = [...set];
          await this.plugin.saveSettings();
        })
      );
    }
  }
}
