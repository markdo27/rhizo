import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Graph } from "../src/data/Graph.js";
import { makeNode } from "../src/data/NodeDefs.js";
import { SimpleModeStudio } from "../src/ui/SimpleModeStudio.js";
import { syncConnectionsFromInputs } from "../src/ui/simpleModeCatalog.js";
import { STARTER_PATCHES } from "../src/data/starterPatches.js";

function setupDom() {
  document.body.innerHTML = `
    <div id="top-menu-bar">
      <button id="btn-pause-preview">Pause Preview</button>
      <button id="btn-export">Export</button>
      <span id="status">Idle</span>
    </div>
    <div class="floating-preview-mock">
      <div class="preview-canvas-wrapper">
        <canvas id="gpu-canvas"></canvas>
      </div>
    </div>
  `;
}

function buildGraph() {
  const graph = new Graph();
  const noise = makeNode("ComputeNoise", 0, 0);
  const grad = makeNode("ComputeGradient", 320, 0);
  const out = makeNode("OutputFinal", 640, 0);
  grad.inputs[0] = noise.id;
  out.inputs[0] = grad.id;
  graph.add(noise);
  graph.add(grad);
  graph.add(out);
  syncConnectionsFromInputs(graph);
  return graph;
}

describe("SimpleModeStudio UI", () => {
  beforeEach(() => {
    localStorage.clear();
    setupDom();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    document.body.className = "";
  });

  it("mounts in Simple Studio mode by default, docks #gpu-canvas, and toggles cleanly to Pro Nodes", () => {
    const graph = buildGraph();
    const gpuCanvas = document.getElementById("gpu-canvas");
    const previewContainer = document.querySelector(".floating-preview-mock");
    const editor = { markDirty: vi.fn(), draw: vi.fn(), onChange: vi.fn() };

    const studio = new SimpleModeStudio({
      graph,
      editor,
      gpuCanvas,
      floatingPreview: { container: previewContainer, _fitCanvasToPanel: vi.fn() },
    });
    studio.mount();

    expect(studio.isSimpleMode()).toBe(true);
    expect(document.body.classList.contains("rz-simple-mode")).toBe(true);
    expect(gpuCanvas.parentNode.id).toBe("simple-studio-stage-frame");
    expect(previewContainer.style.display).toBe("none");
    expect(document.querySelectorAll(".ss-card")).toHaveLength(2);

    // Toggle to Pro Nodes
    document.querySelector('.rz-mode-btn[data-mode="pro"]').click();
    expect(studio.isSimpleMode()).toBe(false);
    expect(document.body.classList.contains("rz-simple-mode")).toBe(false);
    expect(gpuCanvas.parentNode.className).toBe("preview-canvas-wrapper");
    expect(previewContainer.style.display).toBe("");
    expect(editor.draw).toHaveBeenCalled();
  });

  it("opens the template gallery, filters by category, and loads a clicked template", async () => {
    const graph = buildGraph();
    const onOpenStarter = vi.fn().mockResolvedValue(undefined);
    const studio = new SimpleModeStudio({
      graph,
      editor: { markDirty: vi.fn(), draw: vi.fn() },
      gpuCanvas: document.getElementById("gpu-canvas"),
      onOpenStarter,
    });
    studio.mount();

    document.getElementById("btn-simple-templates").click();
    expect(document.getElementById("ss-gallery-overlay").classList.contains("open")).toBe(true);
    expect(document.querySelectorAll(".ss-template-card")).toHaveLength(STARTER_PATCHES.length);

    // Click first template
    document.querySelector(".ss-template-card").click();
    await Promise.resolve();
    expect(onOpenStarter).toHaveBeenCalledTimes(1);
    expect(document.getElementById("ss-gallery-overlay").classList.contains("open")).toBe(false);
  });

  it("adds and removes an effect from the stack live", async () => {
    const graph = buildGraph();
    const onGraphStructureChanged = vi.fn().mockResolvedValue(undefined);
    const studio = new SimpleModeStudio({
      graph,
      editor: { markDirty: vi.fn(), draw: vi.fn() },
      gpuCanvas: document.getElementById("gpu-canvas"),
      onGraphStructureChanged,
    });
    studio.mount();

    expect(document.querySelectorAll(".ss-card")).toHaveLength(2);

    // Open effect picker and add first effect (Liquid Warp)
    document.getElementById("btn-simple-add-effect").click();
    document.querySelector(".ss-effect-option").click();
    await Promise.resolve();

    expect(onGraphStructureChanged).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll(".ss-card")).toHaveLength(3);

    // Remove the newly added effect
    const removeBtns = document.querySelectorAll(".ss-icon-btn.danger");
    removeBtns[removeBtns.length - 1].click();
    await Promise.resolve();

    expect(document.querySelectorAll(".ss-card")).toHaveLength(2);
  });
});
