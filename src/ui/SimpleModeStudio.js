// src/ui/SimpleModeStudio.js
//
// Beginner-friendly "Simple Studio" workspace layered on top of the live
// Rhizomium WebGPU engine. Every slider, palette click, template load, and
// "+ Add Effect" action edits the real node graph directly so users can switch
// seamlessly between Simple Studio and Pro Nodes at any moment.

import { STARTER_PATCHES } from "../data/starterPatches.js";
import {
  COLOR_PALETTES,
  SIMPLE_EFFECTS,
  extractLinearChain,
  describeNodeForSimpleMode,
  isControlActive,
  appendEffectBeforeOutput,
  removeEffectFromChain,
  moveEffectInChain,
  applyPaletteToGraph,
} from "./simpleModeCatalog.js";

const MODE_STORAGE_KEY = "rhizomium.uiMode";

export class SimpleModeStudio {
  constructor(options = {}) {
    this.graph = options.graph;
    this.editor = options.editor;
    this.gpuCanvas = options.gpuCanvas;
    this.floatingPreview = options.floatingPreview;
    this.onOpenStarter = options.onOpenStarter || null;
    this.onGraphStructureChanged = options.onGraphStructureChanged || null;
    this.onStatus = options.onStatus || (() => {});

    this.mode = this._loadInitialMode();
    this.activeTitle = "Starter Visual";
    this.expandedNodeIds = new Set();
    this.effectPickerOpen = false;
    this.galleryCategory = "All";
    this._paramRebuildTimer = null;

    this.root = null;
    this.stageFrame = null;
    this.stageTitleEl = null;
    this.inspectBtn = null;
    this.pauseBtn = null;
    this.stackEl = null;
    this.effectPickerEl = null;
    this.galleryOverlay = null;
    this.toolbarEl = null;
  }

  _loadInitialMode() {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === "simple" || saved === "pro") return saved;
    } catch {
      // Ignore storage failures in restricted contexts.
    }
    return "simple";
  }

  _saveMode(mode) {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore storage failures.
    }
  }

  isSimpleMode() {
    return this.mode === "simple";
  }

  mount() {
    this._mountTopBarControls();
    this._mountWorkspace();
    this._mountGalleryModal();

    if (this.mode === "simple") {
      this._activateSimpleView();
    } else {
      this._syncToolbarState();
    }
  }

  setMode(nextMode) {
    if (nextMode !== "simple" && nextMode !== "pro") return;
    if (this.mode === nextMode) return;
    this.mode = nextMode;
    this._saveMode(nextMode);

    if (nextMode === "simple") {
      this._activateSimpleView();
    } else {
      this._deactivateSimpleView();
    }
  }

  setActiveTitle(title) {
    if (title) {
      this.activeTitle = title;
      if (this.stageTitleEl) {
        this.stageTitleEl.textContent = title;
      }
    }
  }

  /** Re-read the live graph and rebuild the Simple Studio sidebar controls. */
  refresh() {
    if (!this.root) return;
    const chain = extractLinearChain(this.graph);
    if (this.expandedNodeIds.size === 0 && chain.length > 0) {
      this.expandedNodeIds.add(chain[0].id);
      if (chain.length > 1) {
        this.expandedNodeIds.add(chain[chain.length - 1].id);
      }
    }
    this._renderStack(chain);
    this._updateInspectCount();
    this._syncPauseLabel();
  }

  openGallery() {
    if (!this.galleryOverlay) return;
    this._renderGalleryCards();
    this.galleryOverlay.classList.add("open");
  }

  closeGallery() {
    this.galleryOverlay?.classList.remove("open");
  }

  // ---- Top Bar Controls --------------------------------------------------

  _mountTopBarControls() {
    const topBar = document.getElementById("top-menu-bar");
    if (!topBar || document.getElementById("rz-mode-toolbar")) return;

    const toolbar = document.createElement("div");
    toolbar.id = "rz-mode-toolbar";
    toolbar.className = "rz-mode-toolbar";

    const switcher = document.createElement("div");
    switcher.className = "rz-mode-switch";
    switcher.setAttribute("role", "tablist");
    switcher.setAttribute("aria-label", "Workspace mode");

    const simpleBtn = document.createElement("button");
    simpleBtn.type = "button";
    simpleBtn.className = "rz-mode-btn";
    simpleBtn.dataset.mode = "simple";
    simpleBtn.textContent = "Simple Studio";
    simpleBtn.addEventListener("click", () => this.setMode("simple"));

    const proBtn = document.createElement("button");
    proBtn.type = "button";
    proBtn.className = "rz-mode-btn";
    proBtn.dataset.mode = "pro";
    proBtn.textContent = "Pro Nodes";
    proBtn.addEventListener("click", () => this.setMode("pro"));

    switcher.append(simpleBtn, proBtn);

    const templatesBtn = document.createElement("button");
    templatesBtn.type = "button";
    templatesBtn.className = "rz-templates-top-btn";
    templatesBtn.id = "btn-simple-templates";
    templatesBtn.textContent = "Templates";
    templatesBtn.addEventListener("click", () => this.openGallery());

    toolbar.append(switcher, templatesBtn);

    const statusEl = document.getElementById("status");
    if (statusEl && statusEl.parentNode === topBar) {
      topBar.insertBefore(toolbar, statusEl);
    } else {
      topBar.appendChild(toolbar);
    }

    this.toolbarEl = toolbar;
  }

  _syncToolbarState() {
    if (!this.toolbarEl) return;
    this.toolbarEl.querySelectorAll(".rz-mode-btn").forEach((btn) => {
      const isActive = btn.dataset.mode === this.mode;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });
  }

  // ---- Main Workspace DOM ------------------------------------------------

  _mountWorkspace() {
    if (document.getElementById("simple-studio-root")) return;

    const root = document.createElement("div");
    root.id = "simple-studio-root";

    // Left/Center Live Stage
    const stage = document.createElement("section");
    stage.className = "ss-stage";

    const header = document.createElement("div");
    header.className = "ss-stage-header";

    const titleWrap = document.createElement("div");
    titleWrap.className = "ss-stage-title-wrap";

    const badge = document.createElement("span");
    badge.className = "ss-stage-badge";
    badge.textContent = "Live WebGPU";

    const titleEl = document.createElement("div");
    titleEl.className = "ss-stage-title";
    titleEl.textContent = this.activeTitle;

    titleWrap.append(badge, titleEl);

    const hintEl = document.createElement("div");
    hintEl.className = "ss-stage-hint";
    hintEl.textContent = "Tweak controls on the right - zero wiring needed";

    header.append(titleWrap, hintEl);

    const frame = document.createElement("div");
    frame.className = "ss-stage-frame";
    frame.id = "simple-studio-stage-frame";

    const dock = document.createElement("div");
    dock.className = "ss-stage-dock";

    const templatesBtn = this._makeDockBtn("Templates", "ss-dock-btn-accent", () => {
      this.openGallery();
    });

    const pauseBtn = this._makeDockBtn("Pause", "", () => {
      document.getElementById("btn-pause-preview")?.click();
      setTimeout(() => this._syncPauseLabel(), 30);
    });

    const surpriseBtn = this._makeDockBtn("Surprise Me", "", () => {
      this._surpriseLook();
    });

    const exportBtn = this._makeDockBtn("Export", "", () => {
      document.getElementById("btn-export")?.click();
    });

    const inspectBtn = this._makeDockBtn("Inspect Nodes ->", "ss-dock-btn-ghost", () => {
      this.setMode("pro");
    });

    dock.append(templatesBtn, pauseBtn, surpriseBtn, exportBtn, inspectBtn);
    stage.append(header, frame, dock);

    // Right Controls Sidebar
    const sidebar = document.createElement("aside");
    sidebar.className = "ss-sidebar";

    const scroll = document.createElement("div");
    scroll.className = "ss-sidebar-scroll";

    // 1. Color Moods Section
    const paletteSection = document.createElement("div");
    const paletteLabel = document.createElement("div");
    paletteLabel.className = "ss-section-label";
    paletteLabel.textContent = "Quick Color Mood";

    const paletteGrid = document.createElement("div");
    paletteGrid.className = "ss-palette-grid";
    for (const palette of COLOR_PALETTES) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "ss-palette-chip";
      chip.title = `Apply ${palette.name} palette`;

      const swatch = document.createElement("span");
      swatch.className = "ss-palette-swatch";
      swatch.style.background = palette.css;

      const name = document.createElement("span");
      name.className = "ss-palette-name";
      name.textContent = palette.name;

      chip.append(swatch, name);
      chip.addEventListener("click", () => this._handleApplyPalette(palette));
      paletteGrid.appendChild(chip);
    }
    paletteSection.append(paletteLabel, paletteGrid);

    // 2. Visual Stack Section
    const stackSection = document.createElement("div");
    const stackLabel = document.createElement("div");
    stackLabel.className = "ss-section-label";
    stackLabel.innerHTML = "<span>Visual Stack</span><span>Top to bottom</span>";

    const stackEl = document.createElement("div");
    stackEl.className = "ss-stack";
    stackSection.append(stackLabel, stackEl);

    // 3. + Add Effect Button & Inline Picker
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "ss-add-effect-btn";
    addBtn.id = "btn-simple-add-effect";
    addBtn.textContent = "+ Add Visual Effect";
    addBtn.addEventListener("click", () => {
      this.effectPickerOpen = !this.effectPickerOpen;
      this.effectPickerEl?.classList.toggle("open", this.effectPickerOpen);
    });

    const picker = document.createElement("div");
    picker.className = "ss-effect-picker";

    const pickerHeader = document.createElement("div");
    pickerHeader.className = "ss-effect-picker-header";
    const pickerTitle = document.createElement("span");
    pickerTitle.textContent = "Choose an effect to stack";
    const pickerClose = document.createElement("button");
    pickerClose.type = "button";
    pickerClose.className = "ss-icon-btn";
    pickerClose.textContent = "×";
    pickerClose.addEventListener("click", () => {
      this.effectPickerOpen = false;
      picker.classList.remove("open");
    });
    pickerHeader.append(pickerTitle, pickerClose);
    picker.appendChild(pickerHeader);

    for (const effect of SIMPLE_EFFECTS) {
      const opt = document.createElement("button");
      opt.type = "button";
      opt.className = "ss-effect-option";

      const dot = document.createElement("span");
      dot.className = "ss-effect-dot";
      dot.style.background = effect.accent;

      const info = document.createElement("div");
      info.className = "ss-effect-info";

      const name = document.createElement("div");
      name.className = "ss-effect-name";
      name.textContent = effect.title;

      const desc = document.createElement("div");
      desc.className = "ss-effect-desc";
      desc.textContent = effect.description;

      info.append(name, desc);

      const tag = document.createElement("span");
      tag.className = "ss-effect-tag";
      tag.textContent = effect.badge;

      opt.append(dot, info, tag);
      opt.addEventListener("click", () => this._handleAddEffect(effect));
      picker.appendChild(opt);
    }

    scroll.append(paletteSection, stackSection, addBtn, picker);
    sidebar.appendChild(scroll);

    root.append(stage, sidebar);
    document.body.appendChild(root);

    this.root = root;
    this.stageFrame = frame;
    this.stageTitleEl = titleEl;
    this.inspectBtn = inspectBtn;
    this.pauseBtn = pauseBtn;
    this.stackEl = stackEl;
    this.effectPickerEl = picker;
  }

  _makeDockBtn(label, extraClass, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `ss-dock-btn ${extraClass}`.trim();
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  // ---- Mode Transitions --------------------------------------------------

  _activateSimpleView() {
    document.body.classList.add("rz-simple-mode");
    this.root?.classList.add("active");

    if (this.floatingPreview?.container) {
      this.floatingPreview.container.style.display = "none";
    }
    if (this.gpuCanvas && this.stageFrame && this.gpuCanvas.parentNode !== this.stageFrame) {
      this.stageFrame.appendChild(this.gpuCanvas);
    }

    this._syncToolbarState();
    this.refresh();
    window.render?.();
  }

  _deactivateSimpleView() {
    document.body.classList.remove("rz-simple-mode");
    this.root?.classList.remove("active");
    this.closeGallery();

    if (this.floatingPreview?.container && this.gpuCanvas) {
      const wrapper = this.floatingPreview.container.querySelector(".preview-canvas-wrapper");
      if (wrapper && this.gpuCanvas.parentNode !== wrapper) {
        wrapper.appendChild(this.gpuCanvas);
      }
      this.floatingPreview.container.style.display = "";
      this.floatingPreview._fitCanvasToPanel?.();
    } else if (this.gpuCanvas && this.gpuCanvas.parentNode === this.stageFrame) {
      document.body.appendChild(this.gpuCanvas);
    }

    this._syncToolbarState();

    // Frame the node graph so switching to Pro Nodes immediately shows the graph cleanly.
    if (this.editor?.markDirty) {
      this.editor.markDirty("mode-switch-pro");
    }
    if (this.editor?.draw) {
      this.editor.draw();
    }
  }

  // ---- Stack Rendering ---------------------------------------------------

  _renderStack(chain) {
    if (!this.stackEl) return;
    this.stackEl.innerHTML = "";

    if (!chain.length) {
      const empty = document.createElement("div");
      empty.className = "ss-card";
      empty.style.padding = "14px";
      empty.textContent = "Pick a template to start building live visuals.";
      this.stackEl.appendChild(empty);
      return;
    }

    chain.forEach((node, index) => {
      const desc = describeNodeForSimpleMode(node);
      const isExpanded = this.expandedNodeIds.has(node.id);

      const card = document.createElement("div");
      card.className = `ss-card${isExpanded ? " expanded" : ""}`;
      card.dataset.nodeId = node.id;
      card.dataset.role = desc.role;

      const header = document.createElement("div");
      header.className = "ss-card-header";
      header.addEventListener("click", () => {
        if (this.expandedNodeIds.has(node.id)) {
          this.expandedNodeIds.delete(node.id);
          card.classList.remove("expanded");
        } else {
          this.expandedNodeIds.add(node.id);
          card.classList.add("expanded");
        }
      });

      const step = document.createElement("span");
      step.className = "ss-step-num";
      step.textContent = String(index + 1);

      const meta = document.createElement("div");
      meta.className = "ss-card-meta";

      const title = document.createElement("div");
      title.className = "ss-card-title";
      title.textContent = desc.title;

      const hint = document.createElement("div");
      hint.className = "ss-card-hint";
      hint.textContent = desc.hint || desc.subtitle;

      meta.append(title, hint);

      const actions = document.createElement("div");
      actions.className = "ss-card-actions";

      if (desc.canRemove) {
        if (index > 1) {
          const upBtn = this._makeIconBtn("↑", "Move earlier in stack", () => {
            this._handleMoveEffect(node.id, -1);
          });
          actions.appendChild(upBtn);
        }
        if (index < chain.length - 1) {
          const downBtn = this._makeIconBtn("↓", "Move later in stack", () => {
            this._handleMoveEffect(node.id, 1);
          });
          actions.appendChild(downBtn);
        }
        const removeBtn = this._makeIconBtn("×", "Remove effect", () => {
          this._handleRemoveEffect(node.id);
        }, "danger");
        actions.appendChild(removeBtn);
      }

      header.append(step, meta, actions);

      const body = document.createElement("div");
      body.className = "ss-card-body";
      this._renderNodeControls(body, node, desc);

      card.append(header, body);
      this.stackEl.appendChild(card);
    });
  }

  _renderNodeControls(container, node, desc) {
    container.innerHTML = "";
    const params = node.params || {};

    for (const ctrl of desc.controls) {
      if (!isControlActive(ctrl, params)) continue;

      if (ctrl.type === "float" || ctrl.type === "int") {
        container.appendChild(this._buildSliderControl(node, ctrl));
      } else if (ctrl.type === "select" && Array.isArray(ctrl.options)) {
        container.appendChild(this._buildSelectControl(node, ctrl));
      } else if (ctrl.type === "boolean" || ctrl.type === "bool") {
        container.appendChild(this._buildToggleControl(node, ctrl));
      } else if (ctrl.type === "text") {
        container.appendChild(this._buildTextControl(node, ctrl));
      } else if (ctrl.type === "button") {
        container.appendChild(this._buildButtonControl(node, ctrl));
      }
    }
  }

  _buildSliderControl(node, ctrl) {
    const wrap = document.createElement("div");
    wrap.className = "ss-control";

    const top = document.createElement("div");
    top.className = "ss-control-top";

    const label = document.createElement("label");
    label.className = "ss-control-label";
    label.textContent = ctrl.label;

    const valEl = document.createElement("span");
    valEl.className = "ss-control-val";
    const numVal = Number(ctrl.value ?? ctrl.min ?? 0);
    valEl.textContent = formatNumeric(numVal, ctrl.type);

    top.append(label, valEl);

    const input = document.createElement("input");
    input.type = "range";
    input.className = "ss-slider";
    const min = ctrl.min ?? 0;
    const max = ctrl.max ?? 1;
    input.min = String(min);
    input.max = String(max);
    input.step = String(ctrl.step ?? (ctrl.type === "int" ? 1 : (max - min) / 100));
    input.value = String(numVal);

    input.addEventListener("input", () => {
      const next = ctrl.type === "int" ? Math.round(Number(input.value)) : Number(input.value);
      node.params = node.params || {};
      node.params[ctrl.name] = next;
      valEl.textContent = formatNumeric(next, ctrl.type);
      window.updateUniformsOnly?.(node.id, ctrl.name, next);
      this._scheduleParamSync(node, ctrl.name, false);
    });

    input.addEventListener("change", () => {
      this._scheduleParamSync(node, ctrl.name, true);
    });

    wrap.append(top, input);
    return wrap;
  }

  _buildSelectControl(node, ctrl) {
    const wrap = document.createElement("div");
    wrap.className = "ss-control";

    const label = document.createElement("div");
    label.className = "ss-control-label";
    label.textContent = ctrl.label;
    wrap.appendChild(label);

    const options = ctrl.options.map((opt) =>
      typeof opt === "object" ? { value: opt.value, label: opt.label || opt.value } : { value: opt, label: opt },
    );

    if (options.length <= 5) {
      const pills = document.createElement("div");
      pills.className = "ss-pills";
      for (const opt of options) {
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = `ss-pill${ctrl.value === opt.value ? " active" : ""}`;
        pill.textContent = opt.label;
        pill.addEventListener("click", () => {
          node.params = node.params || {};
          node.params[ctrl.name] = opt.value;
          this._commitStructuralParamChange(node);
        });
        pills.appendChild(pill);
      }
      wrap.appendChild(pills);
    } else {
      const select = document.createElement("select");
      select.className = "ss-select";
      for (const opt of options) {
        const el = document.createElement("option");
        el.value = String(opt.value);
        el.textContent = opt.label;
        if (ctrl.value === opt.value) el.selected = true;
        select.appendChild(el);
      }
      select.addEventListener("change", () => {
        node.params = node.params || {};
        node.params[ctrl.name] = select.value;
        this._commitStructuralParamChange(node);
      });
      wrap.appendChild(select);
    }

    return wrap;
  }

  _buildToggleControl(node, ctrl) {
    const row = document.createElement("label");
    row.className = "ss-toggle-row";

    const label = document.createElement("span");
    label.className = "ss-control-label";
    label.textContent = ctrl.label;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "ss-toggle-switch";
    input.checked = Boolean(ctrl.value);
    input.addEventListener("change", () => {
      node.params = node.params || {};
      node.params[ctrl.name] = input.checked;
      this._commitStructuralParamChange(node);
    });

    row.append(label, input);
    return row;
  }

  _buildTextControl(node, ctrl) {
    const wrap = document.createElement("div");
    wrap.className = "ss-control";

    const label = document.createElement("label");
    label.className = "ss-control-label";
    label.textContent = ctrl.label;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "ss-text-input";
    input.value = String(ctrl.value ?? "");
    input.addEventListener("input", () => {
      node.params = node.params || {};
      node.params[ctrl.name] = input.value;
      this._scheduleParamSync(node, ctrl.name, true);
    });

    wrap.append(label, input);
    return wrap;
  }

  _buildButtonControl(node, ctrl) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ss-action-btn";
    btn.textContent = ctrl.label;
    btn.addEventListener("click", () => {
      if (ctrl.action === "resetFeedback") {
        window.computeExecutor?.resetNodeFeedback?.(node.id);
        this.onStatus(`Reset ${node.name || node.kind}`, "info");
      }
    });
    return btn;
  }

  _makeIconBtn(symbol, title, onClick, extraClass = "") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `ss-icon-btn ${extraClass}`.trim();
    btn.title = title;
    btn.setAttribute("aria-label", title);
    btn.textContent = symbol;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  // ---- Graph Mutations & Live Sync ---------------------------------------

  _scheduleParamSync(node, paramName, forceRebuild) {
    const needsRebuild = forceRebuild
      || node.kind === "Text"
      || (node.kind === "ComputeParticles" && paramName === "particleCount");

    if (this._paramRebuildTimer) {
      clearTimeout(this._paramRebuildTimer);
    }

    this._paramRebuildTimer = setTimeout(() => {
      this._paramRebuildTimer = null;
      this.editor?.markDirty?.("simple-param");
      if (needsRebuild) {
        this.editor?.onChange?.("Simple Studio parameter");
      }
    }, needsRebuild ? 120 : 220);
  }

  async _commitStructuralParamChange(node) {
    this.editor?.markDirty?.("simple-param");
    if (this.onGraphStructureChanged) {
      await this.onGraphStructureChanged();
    } else {
      this.editor?.onChange?.("Simple Studio parameter");
    }
    this.refresh();
    if (node) {
      this.expandedNodeIds.add(node.id);
    }
  }

  async _handleApplyPalette(palette) {
    const { node, inserted } = applyPaletteToGraph(this.graph, palette);
    if (!node) return;
    this.expandedNodeIds.add(node.id);
    if (this.onGraphStructureChanged) {
      await this.onGraphStructureChanged();
    }
    this.refresh();
    this.onStatus(
      inserted ? `Added Color Palette (${palette.name})` : `Switched palette to ${palette.name}`,
      "info",
    );
  }

  async _handleAddEffect(effect) {
    const added = appendEffectBeforeOutput(this.graph, effect);
    if (!added) return;
    this.effectPickerOpen = false;
    this.effectPickerEl?.classList.remove("open");
    this.expandedNodeIds.add(added.id);

    if (this.onGraphStructureChanged) {
      await this.onGraphStructureChanged();
    }
    this.refresh();
    this.onStatus(`Added ${effect.title}`, "info");
  }

  async _handleRemoveEffect(nodeId) {
    const ok = removeEffectFromChain(this.graph, nodeId);
    if (!ok) return;
    this.expandedNodeIds.delete(nodeId);
    if (this.onGraphStructureChanged) {
      await this.onGraphStructureChanged();
    }
    this.refresh();
    this.onStatus("Removed effect", "info");
  }

  async _handleMoveEffect(nodeId, direction) {
    const ok = moveEffectInChain(this.graph, nodeId, direction);
    if (!ok) return;
    if (this.onGraphStructureChanged) {
      await this.onGraphStructureChanged();
    }
    this.refresh();
  }

  async _surpriseLook() {
    const palette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
    applyPaletteToGraph(this.graph, palette);

    const chain = extractLinearChain(this.graph);
    for (const node of chain) {
      const desc = describeNodeForSimpleMode(node);
      for (const ctrl of desc.controls) {
        if (ctrl.type !== "float") continue;
        if (["inputMix", "decay", "size", "threshold"].includes(ctrl.name)) continue;
        const min = ctrl.min ?? 0;
        const max = ctrl.max ?? 1;
        // Keep randomized values inside a pleasing middle band so visuals stay vivid.
        const lo = min + (max - min) * 0.15;
        const hi = min + (max - min) * 0.72;
        const value = Number((lo + Math.random() * (hi - lo)).toFixed(2));
        node.params = node.params || {};
        node.params[ctrl.name] = value;
      }
    }

    if (this.onGraphStructureChanged) {
      await this.onGraphStructureChanged();
    }
    this.refresh();
    this.onStatus(`Remixed look with ${palette.name} palette`, "info");
  }

  _updateInspectCount() {
    if (!this.inspectBtn) return;
    const count = this.graph?.nodes?.length || 0;
    this.inspectBtn.textContent = count > 0
      ? `Inspect ${count} Nodes ->`
      : "Open Pro Nodes ->";
  }

  _syncPauseLabel() {
    if (!this.pauseBtn) return;
    const menuBtn = document.getElementById("btn-pause-preview");
    const isPaused = menuBtn?.textContent?.toLowerCase().includes("resume");
    this.pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  }

  // ---- Visual Template Gallery Modal -------------------------------------

  _mountGalleryModal() {
    if (document.getElementById("ss-gallery-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "ss-gallery-overlay";
    overlay.className = "ss-gallery-overlay";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.closeGallery();
    });

    const modal = document.createElement("div");
    modal.className = "ss-gallery-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Visual Template Gallery");

    const header = document.createElement("div");
    header.className = "ss-gallery-header";

    const headerText = document.createElement("div");
    const h2 = document.createElement("h2");
    h2.className = "ss-gallery-title";
    h2.textContent = "Choose a Starting Visual";
    const sub = document.createElement("p");
    sub.className = "ss-gallery-sub";
    sub.textContent = "Pick any live template below, then customize colors, speed, and effects in Simple Studio.";
    headerText.append(h2, sub);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "ss-gallery-close";
    closeBtn.setAttribute("aria-label", "Close templates");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => this.closeGallery());

    header.append(headerText, closeBtn);

    const filters = document.createElement("div");
    filters.className = "ss-gallery-filters";
    this.galleryFiltersEl = filters;

    const grid = document.createElement("div");
    grid.className = "ss-gallery-grid";
    this.galleryGridEl = grid;

    modal.append(header, filters, grid);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    this.galleryOverlay = overlay;
  }

  _renderGalleryCards() {
    if (!this.galleryFiltersEl || !this.galleryGridEl) return;

    const categories = ["All", ...new Set(STARTER_PATCHES.map((p) => p.category || "Starter"))];

    this.galleryFiltersEl.innerHTML = "";
    for (const cat of categories) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `ss-pill${this.galleryCategory === cat ? " active" : ""}`;
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        this.galleryCategory = cat;
        this._renderGalleryCards();
      });
      this.galleryFiltersEl.appendChild(btn);
    }

    const items = this.galleryCategory === "All"
      ? STARTER_PATCHES
      : STARTER_PATCHES.filter((p) => (p.category || "Starter") === this.galleryCategory);

    this.galleryGridEl.innerHTML = "";
    for (const starter of items) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "ss-template-card";
      card.dataset.templateId = starter.id;

      const preview = document.createElement("div");
      preview.className = "ss-template-preview";
      preview.style.background = starter.previewGradient
        || "linear-gradient(135deg, #1b1612, #d9733f)";

      const catPill = document.createElement("span");
      catPill.className = "ss-template-cat";
      catPill.textContent = starter.category || "Starter";

      const nodeBadge = document.createElement("span");
      nodeBadge.className = "ss-template-nodes";
      const nCount = starter.patch?.nodes?.length || 0;
      nodeBadge.textContent = `${nCount} nodes`;

      preview.append(catPill, nodeBadge);

      const body = document.createElement("div");
      body.className = "ss-template-body";

      const name = document.createElement("div");
      name.className = "ss-template-name";
      name.textContent = starter.title;

      const blurb = document.createElement("div");
      blurb.className = "ss-template-blurb";
      blurb.textContent = starter.blurb;

      body.append(name, blurb);
      card.append(preview, body);

      card.addEventListener("click", async () => {
        if (!this.onOpenStarter) return;
        this.closeGallery();
        this.expandedNodeIds.clear();
        await this.onOpenStarter(starter);
        this.setActiveTitle(starter.title);
        this.refresh();
      });

      this.galleryGridEl.appendChild(card);
    }
  }
}

function formatNumeric(value, type) {
  if (!Number.isFinite(value)) return "0";
  if (type === "int") return String(Math.round(value));
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2);
}
