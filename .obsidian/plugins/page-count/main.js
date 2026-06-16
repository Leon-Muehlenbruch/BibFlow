'use strict';

const { Plugin, MarkdownView, PluginSettingTab, Setting, debounce } = require('obsidian');

const DEFAULT_SETTINGS = {
  wordsPerPage: 300, // 12pt, 1,5-zeilig ≈ 300 · einzeilig ≈ 500 · doppelt ≈ 250
};

module.exports = class PageCountPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.statusEl = this.addStatusBarItem();
    this.statusEl.addClass('page-count-status');

    // Live beim Tippen (entprellt), sofort beim Notizwechsel.
    this.debouncedUpdate = debounce(() => this.update(), 400, false);
    this.registerEvent(this.app.workspace.on('editor-change', () => this.debouncedUpdate()));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.update()));
    this.registerEvent(this.app.workspace.on('file-open', () => this.update()));
    this.app.workspace.onLayoutReady(() => this.update());

    this.addSettingTab(new PageCountSettingTab(this.app, this));
  }

  async getActiveText() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view && view.editor) return view.editor.getValue(); // erfasst auch ungespeicherte Änderungen
    const file = this.app.workspace.getActiveFile();
    if (file && file.extension === 'md') return await this.app.vault.cachedRead(file);
    return null;
  }

  countWords(text) {
    if (!text) return 0;
    text = text.replace(/^---\n[\s\S]*?\n---\n?/, ''); // YAML-Frontmatter ignorieren
    const matches = text.match(/[\p{L}\p{N}_]+/gu);
    return matches ? matches.length : 0;
  }

  async update() {
    const text = await this.getActiveText();
    if (text === null) {
      this.statusEl.setText('');
      this.statusEl.removeAttribute('aria-label');
      return;
    }
    const words = this.countWords(text);
    const pages = words / this.settings.wordsPerPage;
    const display = pages < 0.05 ? '0' : pages.toFixed(1);
    this.statusEl.setText(`≈ ${display} Pages`);
    this.statusEl.setAttr(
      'aria-label',
      `${words} Wörter ÷ ${this.settings.wordsPerPage} pro Seite ≈ ${display} Pages`
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.update();
  }
};

class PageCountSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl)
      .setName('Wörter pro Seite')
      .setDesc('Richtwert (12pt, A4): 1,5-zeilig ≈ 300 · einzeilig ≈ 500 · doppelt ≈ 250')
      .addText((t) =>
        t
          .setPlaceholder('300')
          .setValue(String(this.plugin.settings.wordsPerPage))
          .onChange(async (v) => {
            const n = parseInt(v, 10);
            if (!isNaN(n) && n > 0) {
              this.plugin.settings.wordsPerPage = n;
              await this.plugin.saveSettings();
            }
          })
      );
  }
}
