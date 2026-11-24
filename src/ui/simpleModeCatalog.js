// src/ui/simpleModeCatalog.js
//
// Pure data & graph-chain operations for Simple Studio mode.
// Keeps beginner-friendly labels, curated color moods, plain-English effects,
// and lossless chain editing completely decoupled from DOM rendering so every
// rule can be unit-tested cleanly.

import { NodeDefs, makeNode } from "../data/NodeDefs.js";

/** One-click designer color moods applied to ComputeGradient nodes. */
export const COLOR_PALETTES = [
  {
    id: "aurora",
    name: "Aurora",
    css: "linear-gradient(90deg, #0a081f, #17596b, #59d99e, #f2d18c)",
    stops: [
      { position: 0.0, color: [0.04, 0.03, 0.12, 1] },
      { position: 0.4, color: [0.09, 0.35, 0.42, 1] },
      { position: 0.72, color: [0.35, 0.85, 0.62, 1] },
      { position: 1.0, color: [0.95, 0.82, 0.55, 1] },
    ],
  },
  {
    id: "sunset",
    name: "Sunset",
    css: "linear-gradient(90deg, #170a24, #8c2459, #e6683c, #ffd97d)",
    stops: [
      { position: 0.0, color: [0.09, 0.04, 0.14, 1] },
      { position: 0.38, color: [0.55, 0.14, 0.35, 1] },
      { position: 0.72, color: [0.9, 0.41, 0.24, 1] },
      { position: 1.0, color: [1.0, 0.85, 0.49, 1] },
    ],
  },
  {
    id: "cyber",
    name: "Cyber Neon",
    css: "linear-gradient(90deg, #08051a, #7b2cbf, #f43f97, #22d3ee)",
    stops: [
      { position: 0.0, color: [0.03, 0.02, 0.1, 1] },
      { position: 0.38, color: [0.48, 0.17, 0.75, 1] },
      { position: 0.72, color: [0.96, 0.25, 0.59, 1] },
      { position: 1.0, color: [0.13, 0.83, 0.93, 1] },
    ],
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    css: "linear-gradient(90deg, #040d1a, #0e3b66, #1ca3c4, #a8f0ff)",
    stops: [
      { position: 0.0, color: [0.02, 0.05, 0.1, 1] },
      { position: 0.4, color: [0.05, 0.23, 0.4, 1] },
      { position: 0.75, color: [0.11, 0.64, 0.77, 1] },
      { position: 1.0, color: [0.66, 0.94, 1.0, 1] },
    ],
  },
  {
    id: "lava",
    name: "Lava Ember",
    css: "linear-gradient(90deg, #0f0708, #6b1515, #e04f1f, #ffe285)",
    stops: [
      { position: 0.0, color: [0.06, 0.03, 0.03, 1] },
      { position: 0.42, color: [0.42, 0.08, 0.08, 1] },
      { position: 0.75, color: [0.88, 0.31, 0.12, 1] },
      { position: 1.0, color: [1.0, 0.89, 0.52, 1] },
    ],
  },
  {
    id: "acid",
    name: "Acid Lime",
    css: "linear-gradient(90deg, #07120e, #165947, #6ee73b, #f7ff7a)",
    stops: [
      { position: 0.0, color: [0.03, 0.07, 0.05, 1] },
      { position: 0.4, color: [0.09, 0.35, 0.28, 1] },
      { position: 0.75, color: [0.43, 0.91, 0.23, 1] },
      { position: 1.0, color: [0.97, 1.0, 0.48, 1] },
    ],
  },
  {
    id: "pastel",
    name: "Pastel Dream",
    css: "linear-gradient(90deg, #1f1a33, #8f82d9, #f2a7c8, #ffe8d6)",
    stops: [
      { position: 0.0, color: [0.12, 0.1, 0.2, 1] },
      { position: 0.38, color: [0.56, 0.51, 0.85, 1] },
      { position: 0.72, color: [0.95, 0.65, 0.78, 1] },
      { position: 1.0, color: [1.0, 0.91, 0.84, 1] },
    ],
  },
  {
    id: "mono",
    name: "Mono B&W",
    css: "linear-gradient(90deg, #080808, #444444, #a8a8a8, #fafafa)",
    stops: [
      { position: 0.0, color: [0.03, 0.03, 0.03, 1] },
      { position: 0.45, color: [0.27, 0.27, 0.27, 1] },
      { position: 0.78, color: [0.7, 0.7, 0.7, 1] },
      { position: 1.0, color: [0.98, 0.98, 0.98, 1] },
    ],
  },
];

/** Plain-English one-click effects that can be appended to any visual chain. */
export const SIMPLE_EFFECTS = [
  {
    id: "liquid-warp",
    kind: "ComputeWarp",
    title: "Liquid Warp",
    description: "Bend visuals with waves, swirls, or lens bulge",
    badge: "Distort",
    accent: "#8f7ec9",
    defaultName: "Liquid Warp",
    defaultParams: { mode: "Wave", strength: 0.45, frequency: 4.5 },
  },
  {
    id: "kaleidoscope",
    kind: "ComputeKaleidoscope",
    title: "Kaleidoscope",
    description: "Fold into spinning mirror symmetry",
    badge: "Symmetry",
    accent: "#cf6499",
    defaultName: "Kaleidoscope",
    defaultParams: { segments: 8, scale: 1.2, animate: true, speed: 0.35 },
  },
  {
    id: "color-palette",
    kind: "ComputeGradient",
    title: "Color Palette",
    description: "Recolor brightness into a rich designer gradient",
    badge: "Color",
    accent: "#d9733f",
    defaultName: "Color Palette",
    defaultParams: {
      type: "Linear",
      colorMode: "Gradient",
      interpolation: "Smooth",
      inputMix: 1.0,
      colorStops: COLOR_PALETTES[0].stops,
    },
  },
  {
    id: "glitch",
    kind: "ComputeGlitch",
    title: "Glitch & RGB Split",
    description: "Chromatic shift, scanlines, or pixel blocks",
    badge: "Retro",
    accent: "#22d3ee",
    defaultName: "Glitch FX",
    defaultParams: { type: "RGB Shift", intensity: 0.35, frequency: 0.5 },
  },
  {
    id: "soft-blur",
    kind: "ComputeBlur",
    title: "Dreamy Blur",
    description: "Soften edges for atmospheric depth or glow",
    badge: "Filter",
    accent: "#46a89b",
    defaultName: "Dreamy Blur",
    defaultParams: { radius: 6.0, quality: "Medium", direction: "Both" },
  },
  {
    id: "color-grade",
    kind: "ComputeColorAdjust",
    title: "Color Grade",
    description: "Fine-tune brightness, contrast, hue, and saturation",
    badge: "Color",
    accent: "#c99a4a",
    defaultName: "Color Grade",
    defaultParams: { brightness: 0.0, contrast: 1.2, saturation: 1.3, hue: 0.0 },
  },
  {
    id: "motion-trails",
    kind: "ComputeFeedback",
    title: "Motion Trails",
    description: "Blend previous frames for glowing echo trails",
    badge: "Motion",
    accent: "#c46f7d",
    defaultName: "Motion Trails",
    defaultParams: { decay: 0.9, scale: 1.015, rotation: 0.5 },
  },
  {
    id: "neon-edges",
    kind: "ComputeEdgeDetect",
    title: "Neon Outlines",
    description: "Extract crisp glowing contour lines",
    badge: "Stylize",
    accent: "#4aa6ba",
    defaultName: "Neon Edges",
    defaultParams: { method: "Sobel", threshold: 0.08, strength: 2.2 },
  },
  {
    id: "transform",
    kind: "ComputeTransform",
    title: "Zoom & Tile",
    description: "Rotate, zoom, mirror, or repeat the frame",
    badge: "Layout",
    accent: "#a074c9",
    defaultName: "Zoom & Tile",
    defaultParams: { scaleX: 1.5, scaleY: 1.5, rotation: 0.0, wrapMode: "Mirror" },
  },
  {
    id: "posterize",
    kind: "ComputeThreshold",
    title: "High Contrast Cut",
    description: "Turn tones into bold graphic silhouettes",
    badge: "Graphic",
    accent: "#6f9cc4",
    defaultName: "Graphic Cut",
    defaultParams: { mode: "Binary", threshold: 0.48 },
  },
];

/**
 * Curated plain-English metadata and top controls for common Rhizomium nodes.
 * Any node not listed here falls back cleanly to its NodeDefs parameter specs.
 */
const FRIENDLY_NODE_MAP = {
  ComputeNoise: {
    title: "Organic Noise",
    role: "Source",
    hint: "Flowing clouds & terrain texture",
    params: [
      { name: "scale", label: "Zoom / Detail", step: 0.1 },
      { name: "speed", label: "Flow Speed", step: 0.02 },
      { name: "octaves", label: "Complexity", step: 1 },
      { name: "colorize", label: "Auto Color" },
    ],
  },
  ComputeVoronoi: {
    title: "Cellular Pattern",
    role: "Source",
    hint: "Organic crystal & bubble cells",
    params: [
      { name: "mode", label: "Cell Style" },
      { name: "scale", label: "Cell Size", step: 0.1 },
      { name: "pointCount", label: "Cell Count", step: 1 },
      { name: "speed", label: "Motion Speed", step: 0.02 },
    ],
  },
  ComputePattern: {
    title: "Geometric Pattern",
    role: "Source",
    hint: "Dots, stripes, hexagons & grids",
    params: [
      { name: "type", label: "Shape" },
      { name: "scaleX", label: "Columns", step: 0.5 },
      { name: "scaleY", label: "Rows", step: 0.5 },
      { name: "thickness", label: "Shape Size", step: 0.01 },
      { name: "rotation", label: "Angle", step: 1 },
    ],
  },
  ComputeFluidSim: {
    title: "Fluid Ink",
    role: "Source",
    hint: "Live swirling liquid simulation",
    params: [
      { name: "timestep", label: "Flow Speed", step: 0.01 },
      { name: "curl", label: "Swirl Intensity", step: 0.5 },
      { name: "forceStrength", label: "Stir Power", step: 0.1 },
      { name: "dyeAmount", label: "Ink Richness", step: 0.1 },
      { name: "colorMode", label: "View Mode" },
      { name: "reset", label: "Reset Fluid" },
    ],
  },
  ComputeReactionDiffusion: {
    title: "Coral Simulation",
    role: "Source",
    hint: "Self-growing organic patterns",
    params: [
      { name: "pattern", label: "Growth Style" },
      { name: "timestep", label: "Growth Speed", step: 0.05 },
      { name: "feedRate", label: "Feed Rate", step: 0.001 },
      { name: "killRate", label: "Decay Rate", step: 0.001 },
    ],
  },
  ComputeParticles: {
    title: "Particle Swarm",
    role: "Source",
    hint: "Thousands of glowing GPU particles",
    params: [
      { name: "particleCount", label: "Particle Count", step: 500 },
      { name: "speed", label: "Speed", step: 0.05 },
      { name: "size", label: "Dot Size", step: 0.1 },
      { name: "depth", label: "3D Depth", step: 0.05 },
      { name: "glow", label: "Glow", step: 0.05 },
      { name: "twinkle", label: "Twinkle", step: 0.05 },
    ],
  },
  Text: {
    title: "Typography",
    role: "Source",
    hint: "Live editable headline text",
    params: [
      { name: "text", label: "Your Text" },
      { name: "size", label: "Font Size", step: 0.01 },
      { name: "fontFamily", label: "Typeface" },
      { name: "bold", label: "Bold" },
      { name: "letterSpacing", label: "Tracking", step: 0.02 },
    ],
  },
  ComputeGradient: {
    title: "Color Palette",
    role: "Effect",
    hint: "Maps tones into smooth colors",
    params: [
      { name: "colorMode", label: "Color Style" },
      { name: "inputMix", label: "Follow Source", step: 0.05 },
      { name: "repeat", label: "Color Bands", step: 1 },
      { name: "reverse", label: "Flip Colors" },
    ],
  },
  ComputeWarp: {
    title: "Liquid Warp",
    role: "Effect",
    hint: "Distorts & bends the image",
    params: [
      { name: "mode", label: "Warp Style" },
      { name: "strength", label: "Intensity", step: 0.05 },
      { name: "frequency", label: "Wave Ripples", step: 0.2 },
      { name: "radius", label: "Reach", step: 0.05 },
    ],
  },
  ComputeKaleidoscope: {
    title: "Kaleidoscope",
    role: "Effect",
    hint: "Mirror-folds visuals into radial symmetry",
    params: [
      { name: "segments", label: "Mirror Slices", step: 1 },
      { name: "scale", label: "Zoom", step: 0.05 },
      { name: "animate", label: "Auto Spin" },
      { name: "speed", label: "Spin Speed", step: 0.05 },
    ],
  },
  ComputeGlitch: {
    title: "Glitch & RGB Split",
    role: "Effect",
    hint: "Chromatic shift & retro digital artifacts",
    params: [
      { name: "type", label: "Glitch Style" },
      { name: "intensity", label: "Strength", step: 0.02 },
      { name: "frequency", label: "Flicker", step: 0.02 },
      { name: "blockSize", label: "Block Size", step: 0.01 },
    ],
  },
  ComputeBlur: {
    title: "Dreamy Blur",
    role: "Effect",
    hint: "Softens details for bloom or depth",
    params: [
      { name: "radius", label: "Softness", step: 0.5 },
      { name: "direction", label: "Direction" },
    ],
  },
  ComputeColorAdjust: {
    title: "Color Grade",
    role: "Effect",
    hint: "Adjust tone, vibrancy, and hue",
    params: [
      { name: "brightness", label: "Brightness", step: 0.02 },
      { name: "contrast", label: "Contrast", step: 0.05 },
      { name: "saturation", label: "Vibrancy", step: 0.05 },
      { name: "hue", label: "Hue Shift", step: 2 },
    ],
  },
  ComputeFeedback: {
    title: "Motion Trails",
    role: "Effect",
    hint: "Echoes previous frames over time",
    params: [
      { name: "decay", label: "Trail Length", step: 0.01 },
      { name: "scale", label: "Zoom Drift", step: 0.002 },
      { name: "rotation", label: "Spin Drift", step: 0.2 },
      { name: "reset", label: "Clear Trails" },
    ],
  },
  ComputeEdgeDetect: {
    title: "Neon Outlines",
    role: "Effect",
    hint: "Highlights sharp edges as glowing lines",
    params: [
      { name: "strength", label: "Line Glow", step: 0.1 },
      { name: "threshold", label: "Sensitivity", step: 0.02 },
      { name: "invertEdges", label: "Invert Lines" },
    ],
  },
  ComputeTransform: {
    title: "Zoom & Tile",
    role: "Effect",
    hint: "Scale, spin, or mirror-tile the canvas",
    params: [
      { name: "scaleX", label: "Zoom X", step: 0.05 },
      { name: "scaleY", label: "Zoom Y", step: 0.05 },
      { name: "rotation", label: "Rotate", step: 1 },
      { name: "wrapMode", label: "Edge Repeat" },
    ],
  },
  ComputeThreshold: {
    title: "High Contrast Cut",
    role: "Effect",
    hint: "Bold graphic black-and-white cut",
    params: [
      { name: "mode", label: "Cut Mode" },
      { name: "threshold", label: "Cutoff", step: 0.02 },
    ],
  },
  ComputeMix: {
    title: "Layer Blend",
    role: "Effect",
    hint: "Combines two visual signals together",
    params: [
      { name: "mode", label: "Blend Mode" },
      { name: "amount", label: "Mix Amount", step: 0.02 },
      { name: "opacity", label: "Opacity", step: 0.02 },
    ],
  },
};

/** Normalize a connection regardless of whether it uses {from:{nodeId,pin}} or {fromNode,fromPin}. */
function readConn(conn) {
  if (!conn) return null;
  if (conn.from && conn.to) {
    return {
      fromNode: conn.from.nodeId,
      fromPin: Number(conn.from.pin ?? 0) || 0,
      toNode: conn.to.nodeId,
      toPin: Number(conn.to.pin ?? 0) || 0,
    };
  }
  if (conn.fromNode !== undefined && conn.toNode !== undefined) {
    return {
      fromNode: conn.fromNode,
      fromPin: Number(conn.fromPin ?? 0) || 0,
      toNode: conn.toNode,
      toPin: Number(conn.toPin ?? 0) || 0,
    };
  }
  return null;
}

/** Rebuild graph.connections cleanly from each node's inputs[] while preserving extra pin info. */
export function syncConnectionsFromInputs(graph) {
  if (!graph || !Array.isArray(graph.nodes)) return;
  const existing = (graph.connections || []).map(readConn).filter(Boolean);
  const existingFromPin = new Map();
  for (const c of existing) {
    existingFromPin.set(`${c.fromNode}->${c.toNode}:${c.toPin}`, c.fromPin);
  }

  const next = [];
  for (const node of graph.nodes) {
    const inputs = Array.isArray(node.inputs) ? node.inputs : [];
    for (let pin = 0; pin < inputs.length; pin++) {
      const sourceId = inputs[pin];
      if (!sourceId) continue;
      const fromPin = existingFromPin.get(`${sourceId}->${node.id}:${pin}`) ?? 0;
      next.push({
        from: { nodeId: sourceId, pin: fromPin },
        to: { nodeId: node.id, pin },
      });
    }
  }
  graph.connections = next;
  graph.markExecutionOrderDirty?.();
}

/** Find the primary OutputFinal node in a graph. */
export function findOutputNode(graph) {
  if (!graph?.nodes?.length) return null;
  return graph.nodes.find((n) => n.kind === "OutputFinal")
    || graph.nodes.find((n) => NodeDefs[n.kind]?.cat === "Output")
    || null;
}

/** Find the upstream node feeding `node` on pin `pinIndex` (checks both node.inputs and graph.connections). */
export function findUpstreamNodeId(graph, node, pinIndex = 0) {
  if (!graph || !node) return null;
  if (Array.isArray(node.inputs) && node.inputs[pinIndex]) {
    return node.inputs[pinIndex];
  }
  for (const raw of graph.connections || []) {
    const c = readConn(raw);
    if (c && c.toNode === node.id && c.toPin === pinIndex) {
      return c.fromNode;
    }
  }
  return null;
}

/**
 * Walk backward from OutputFinal along primary pin 0 to return the ordered list
 * of visible source + effect nodes driving the canvas (earliest source first).
 * Utility coordinate nodes like UV are skipped from the beginner stack so users
 * see only meaningful visual layers.
 */
export function extractLinearChain(graph) {
  const output = findOutputNode(graph);
  if (!output) return [];

  const byId = new Map((graph.nodes || []).map((n) => [n.id, n]));
  const chain = [];
  const visited = new Set([output.id]);
  let currentId = findUpstreamNodeId(graph, output, 0);

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = byId.get(currentId);
    if (!node) break;
    if (node.kind !== "UV" && node.kind !== "Time") {
      chain.unshift(node);
    }
    currentId = findUpstreamNodeId(graph, node, 0);
  }

  return chain;
}

/**
 * Build a plain-English descriptor for a node in Simple Studio, including the
 * top controls to display (sliders, dropdowns, toggles, text inputs, buttons).
 */
export function describeNodeForSimpleMode(node) {
  const def = NodeDefs[node.kind] || {};
  const mapped = FRIENDLY_NODE_MAP[node.kind];
  const allSpecs = Array.isArray(def.params) ? def.params : [];
  const specByName = new Map(allSpecs.map((p) => [p.name, p]));
  const params = node.params || {};

  const isSource = mapped
    ? mapped.role === "Source"
    : (def.pinsIn?.length || 0) === 0 || def.cat === "Generators" || def.cat === "Dynamics";

  const controls = [];
  if (mapped) {
    for (const item of mapped.params) {
      const spec = specByName.get(item.name);
      if (!spec) continue;
      controls.push({
        name: spec.name,
        label: item.label || spec.displayName || spec.label || spec.name,
        type: spec.type,
        min: spec.min,
        max: spec.max,
        step: item.step ?? spec.step,
        options: spec.options,
        value: params[spec.name] !== undefined ? params[spec.name] : spec.default,
        action: spec.action,
        activeWhen: spec.activeWhen,
      });
    }
  } else {
    // Generic fallback for any other Rhizomium node (first 5 beginner-friendly controls).
    for (const spec of allSpecs) {
      if (controls.length >= 5) break;
      if (spec.name === "resolution" || spec.name === "seed") continue;
      if (!["float", "int", "select", "boolean", "bool", "text", "button"].includes(spec.type)) {
        continue;
      }
      controls.push({
        name: spec.name,
        label: spec.displayName || spec.label || humanizeParamName(spec.name),
        type: spec.type,
        min: spec.min,
        max: spec.max,
        step: spec.step,
        options: spec.options,
        value: params[spec.name] !== undefined ? params[spec.name] : spec.default,
        action: spec.action,
        activeWhen: spec.activeWhen,
      });
    }
  }

  return {
    id: node.id,
    kind: node.kind,
    title: node.name || mapped?.title || def.label || node.kind,
    subtitle: mapped?.title || def.label || node.kind,
    hint: mapped?.hint || def.description || "",
    role: isSource ? "Source" : "Effect",
    canRemove: !isSource && (def.pinsIn?.length || 0) >= 1,
    controls,
  };
}

/** Check whether a control should be visible given its node's current param values. */
export function isControlActive(control, nodeParams = {}) {
  if (!control.activeWhen) return true;
  for (const [depName, expected] of Object.entries(control.activeWhen)) {
    const actual = nodeParams[depName];
    if (Array.isArray(expected)) {
      if (!expected.includes(actual)) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

/**
 * Append a plain-English effect right before OutputFinal, cleanly splicing it
 * between OutputFinal's current upstream node and OutputFinal pin 0.
 */
export function appendEffectBeforeOutput(graph, effectSpec) {
  const output = findOutputNode(graph);
  if (!output || !effectSpec?.kind || !NodeDefs[effectSpec.kind]) {
    return null;
  }

  const prevId = findUpstreamNodeId(graph, output, 0);
  const newX = (Number(output.x) || 640);
  const newY = (Number(output.y) || 0);
  output.x = newX + 320;

  const node = makeNode(effectSpec.kind, newX, newY);
  if (effectSpec.defaultName) {
    node.name = effectSpec.defaultName;
  }
  node.params = {
    ...(node.params || {}),
    ...(effectSpec.defaultParams ? deepClone(effectSpec.defaultParams) : {}),
  };
  node.inputs = Array.isArray(node.inputs) ? node.inputs : [];
  if (prevId) {
    node.inputs[0] = prevId;
  }

  output.inputs = Array.isArray(output.inputs) ? output.inputs : [];
  output.inputs[0] = node.id;

  if (typeof graph.add === "function") {
    graph.add(node);
  } else {
    graph.nodes.push(node);
  }
  syncConnectionsFromInputs(graph);
  return node;
}

/**
 * Remove an effect node from the linear chain and bridge its upstream input 0
 * straight into every downstream input that pointed at it, so the canvas never
 * goes black.
 */
export function removeEffectFromChain(graph, nodeId) {
  if (!graph?.nodes?.length) return false;
  const target = graph.nodes.find((n) => n.id === nodeId);
  if (!target) return false;

  const upstreamId = findUpstreamNodeId(graph, target, 0);
  for (const node of graph.nodes) {
    if (node.id === nodeId || !Array.isArray(node.inputs)) continue;
    for (let i = 0; i < node.inputs.length; i++) {
      if (node.inputs[i] === nodeId) {
        node.inputs[i] = upstreamId || null;
      }
    }
  }

  if (typeof graph.remove === "function") {
    graph.remove(target);
  } else {
    graph.nodes = graph.nodes.filter((n) => n.id !== nodeId);
  }
  syncConnectionsFromInputs(graph);
  return true;
}

/**
 * Swap an effect node one position up (-1) or down (+1) in the primary chain.
 * Only swaps adjacent removable effects so the root generator stays at step 1.
 */
export function moveEffectInChain(graph, nodeId, direction) {
  const chain = extractLinearChain(graph);
  const idx = chain.findIndex((n) => n.id === nodeId);
  if (idx <= 0) return false; // cannot move source or missing node

  const swapIdx = idx + (direction < 0 ? -1 : 1);
  if (swapIdx <= 0 || swapIdx >= chain.length) return false;

  const firstIdx = Math.min(idx, swapIdx);
  const secondIdx = Math.max(idx, swapIdx);
  const beforeNode = chain[firstIdx - 1];
  const nodeA = chain[firstIdx];
  const nodeB = chain[secondIdx];
  const afterNode = secondIdx + 1 < chain.length ? chain[secondIdx + 1] : findOutputNode(graph);

  if (!beforeNode || !nodeA || !nodeB || !afterNode) return false;

  // Before: beforeNode -> nodeA -> nodeB -> afterNode
  // After:  beforeNode -> nodeB -> nodeA -> afterNode
  nodeB.inputs = Array.isArray(nodeB.inputs) ? nodeB.inputs : [];
  nodeA.inputs = Array.isArray(nodeA.inputs) ? nodeA.inputs : [];
  afterNode.inputs = Array.isArray(afterNode.inputs) ? afterNode.inputs : [];

  nodeB.inputs[0] = beforeNode.id;
  nodeA.inputs[0] = nodeB.id;
  afterNode.inputs[0] = nodeA.id;

  // Swap x positions so Pro Nodes view also stays tidy left-to-right.
  const tmpX = nodeA.x;
  nodeA.x = nodeB.x;
  nodeB.x = tmpX;

  syncConnectionsFromInputs(graph);
  return true;
}

/**
 * Apply one of the curated COLOR_PALETTES to the current graph.
 * If a ComputeGradient already exists in the chain, recolors it in place;
 * otherwise inserts a new Color Palette node right before OutputFinal.
 */
export function applyPaletteToGraph(graph, palette) {
  if (!graph || !palette?.stops) return { node: null, inserted: false };
  const chain = extractLinearChain(graph);
  let gradientNode = chain.find((n) => n.kind === "ComputeGradient");
  let inserted = false;

  if (!gradientNode) {
    const paletteEffect = SIMPLE_EFFECTS.find((e) => e.id === "color-palette");
    gradientNode = appendEffectBeforeOutput(graph, paletteEffect);
    inserted = !!gradientNode;
  }

  if (!gradientNode) return { node: null, inserted: false };

  gradientNode.params = {
    ...(gradientNode.params || {}),
    colorMode: "Gradient",
    interpolation: "Smooth",
    inputMix: 1.0,
    colorStops: deepClone(palette.stops),
  };

  return { node: gradientNode, inserted };
}

function humanizeParamName(name) {
  return String(name || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function deepClone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}
