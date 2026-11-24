import { describe, it, expect } from "vitest";
import { Graph } from "../src/data/Graph.js";
import { makeNode } from "../src/data/NodeDefs.js";
import {
  COLOR_PALETTES,
  SIMPLE_EFFECTS,
  extractLinearChain,
  describeNodeForSimpleMode,
  appendEffectBeforeOutput,
  removeEffectFromChain,
  moveEffectInChain,
  applyPaletteToGraph,
  syncConnectionsFromInputs,
} from "../src/ui/simpleModeCatalog.js";

function buildTestGraph() {
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

  return { graph, noise, grad, out };
}

describe("simpleModeCatalog", () => {
  it("extracts the ordered linear chain before OutputFinal", () => {
    const { graph, noise, grad } = buildTestGraph();
    const chain = extractLinearChain(graph);
    expect(chain.map((n) => n.id)).toEqual([noise.id, grad.id]);
  });

  it("appends a plain-English effect cleanly before OutputFinal", () => {
    const { graph, noise, grad, out } = buildTestGraph();
    const kaleidoSpec = SIMPLE_EFFECTS.find((e) => e.id === "kaleidoscope");
    const added = appendEffectBeforeOutput(graph, kaleidoSpec);

    expect(added).toBeTruthy();
    expect(added.kind).toBe("ComputeKaleidoscope");
    expect(added.inputs[0]).toBe(grad.id);
    expect(out.inputs[0]).toBe(added.id);

    const chain = extractLinearChain(graph);
    expect(chain.map((n) => n.id)).toEqual([noise.id, grad.id, added.id]);
  });

  it("removes a middle effect and bridges upstream directly to downstream", () => {
    const { graph, noise, grad, out } = buildTestGraph();
    const warpSpec = SIMPLE_EFFECTS.find((e) => e.id === "liquid-warp");
    const warp = appendEffectBeforeOutput(graph, warpSpec);

    const removed = removeEffectFromChain(graph, grad.id);
    expect(removed).toBe(true);
    expect(warp.inputs[0]).toBe(noise.id);
    expect(out.inputs[0]).toBe(warp.id);

    const chain = extractLinearChain(graph);
    expect(chain.map((n) => n.id)).toEqual([noise.id, warp.id]);
  });

  it("reorders adjacent effects without breaking the signal path", () => {
    const { graph, noise, grad, out } = buildTestGraph();
    const glitchSpec = SIMPLE_EFFECTS.find((e) => e.id === "glitch");
    const glitch = appendEffectBeforeOutput(graph, glitchSpec);

    const moved = moveEffectInChain(graph, glitch.id, -1);
    expect(moved).toBe(true);

    const chain = extractLinearChain(graph);
    expect(chain.map((n) => n.id)).toEqual([noise.id, glitch.id, grad.id]);
    expect(glitch.inputs[0]).toBe(noise.id);
    expect(grad.inputs[0]).toBe(glitch.id);
    expect(out.inputs[0]).toBe(grad.id);
  });

  it("applies a curated palette to an existing gradient or inserts one when missing", () => {
    const { graph, grad } = buildTestGraph();
    const cyber = COLOR_PALETTES.find((p) => p.id === "cyber");

    const res1 = applyPaletteToGraph(graph, cyber);
    expect(res1.inserted).toBe(false);
    expect(res1.node.id).toBe(grad.id);
    expect(grad.params.colorStops).toEqual(cyber.stops);

    removeEffectFromChain(graph, grad.id);
    const res2 = applyPaletteToGraph(graph, cyber);
    expect(res2.inserted).toBe(true);
    expect(res2.node.kind).toBe("ComputeGradient");
    expect(res2.node.params.colorStops).toEqual(cyber.stops);
  });

  it("describes nodes with plain-English labels and controls", () => {
    const { noise, grad } = buildTestGraph();
    const noiseDesc = describeNodeForSimpleMode(noise);
    const gradDesc = describeNodeForSimpleMode(grad);

    expect(noiseDesc.role).toBe("Source");
    expect(noiseDesc.canRemove).toBe(false);
    expect(noiseDesc.controls.some((c) => c.name === "speed")).toBe(true);

    expect(gradDesc.role).toBe("Effect");
    expect(gradDesc.canRemove).toBe(true);
  });
});
