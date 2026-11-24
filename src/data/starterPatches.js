// src/data/starterPatches.js - curated visual templates for Simple Studio & Welcome Screen.
//
// Each template is a complete, immediately-animated WebGPU patch that renders
// cleanly on frame 1 without requiring any manual wiring. Every node kind,
// parameter range, and wire is checked by tests/starterPatches.test.js.

/** Horizontal distance between columns. A node card is 180 wide. */
const COL = 320;

export const STARTER_PATCHES = [
  {
    id: "aurora-field",
    title: "Aurora Field",
    category: "Abstract",
    blurb: "Drifting noise coloured by a gradient, then displaced by the same noise.",
    previewGradient: "linear-gradient(135deg, #0a081f 0%, #17596b 38%, #59d99e 74%, #f2d18c 100%)",
    patch: {
      nodes: [
        {
          id: "noise",
          kind: "ComputeNoise",
          name: "Drift",
          x: 0,
          y: 0,
          params: { scale: 3.0, octaves: 5, speed: 0.08, colorize: false },
        },
        {
          id: "gradient",
          kind: "ComputeGradient",
          name: "Aurora Ramp",
          x: COL,
          y: 0,
          params: {
            type: "Linear",
            colorMode: "Gradient",
            interpolation: "Smooth",
            inputMix: 1.0,
            colorStops: [
              { position: 0.0, color: [0.04, 0.03, 0.12, 1] },
              { position: 0.4, color: [0.09, 0.35, 0.42, 1] },
              { position: 0.72, color: [0.35, 0.85, 0.62, 1] },
              { position: 1.0, color: [0.95, 0.82, 0.55, 1] },
            ],
          },
        },
        {
          id: "warp",
          kind: "ComputeWarp",
          name: "Curtain",
          x: COL * 2,
          y: 0,
          params: { mode: "Displace", strength: 0.35 },
        },
        { id: "out", kind: "OutputFinal", x: COL * 3, y: 0, params: {} },
      ],
      connections: [
        { from: { nodeId: "noise", pin: 0 }, to: { nodeId: "gradient", pin: 0 } },
        { from: { nodeId: "gradient", pin: 0 }, to: { nodeId: "warp", pin: 0 } },
        { from: { nodeId: "noise", pin: 0 }, to: { nodeId: "warp", pin: 1 } },
        { from: { nodeId: "warp", pin: 0 }, to: { nodeId: "out", pin: 0 } },
      ],
    },
  },

  {
    id: "mirror-cells",
    title: "Mirror Cells",
    category: "Geometric",
    blurb: "Animated Voronoi cells folded through eight-fold kaleidoscope symmetry.",
    previewGradient: "linear-gradient(135deg, #1b1138 0%, #7d4cdb 45%, #e86ca8 80%, #ffbe76 100%)",
    patch: {
      nodes: [
        {
          id: "cells",
          kind: "ComputeVoronoi",
          name: "Cells",
          x: 0,
          y: 0,
          params: { mode: "Cells", scale: 5.0, pointCount: 24, animate: true, speed: 0.12 },
        },
        {
          id: "kaleido",
          kind: "ComputeKaleidoscope",
          name: "Fold",
          x: COL,
          y: 0,
          params: { segments: 8, scale: 1.4, animate: true, speed: 0.2 },
        },
        { id: "out", kind: "OutputFinal", x: COL * 2, y: 0, params: {} },
      ],
      connections: [
        { from: { nodeId: "cells", pin: 0 }, to: { nodeId: "kaleido", pin: 0 } },
        { from: { nodeId: "kaleido", pin: 0 }, to: { nodeId: "out", pin: 0 } },
      ],
    },
  },

  {
    id: "dot-bloom",
    title: "Dot Bloom",
    category: "Geometric",
    blurb: "A dot grid screened back over its own blur - the bloom recipe, in three nodes.",
    previewGradient: "radial-gradient(circle at 30% 30%, #ffffff 0%, #a0a8c0 28%, #1d2233 70%, #090b10 100%)",
    patch: {
      nodes: [
        {
          id: "dots",
          kind: "ComputePattern",
          name: "Dots",
          x: 0,
          y: 0,
          params: { type: "Dots", scaleX: 10.0, scaleY: 10.0, thickness: 0.35, smoothness: 0.05 },
        },
        {
          id: "blur",
          kind: "ComputeBlur",
          name: "Halo",
          x: COL,
          y: 0,
          params: { radius: 12.0, quality: "High" },
        },
        {
          id: "mix",
          kind: "ComputeMix",
          name: "Screen Back",
          x: COL * 2,
          y: 0,
          params: { mode: "Screen", amount: 1.0 },
        },
        { id: "out", kind: "OutputFinal", x: COL * 3, y: 0, params: {} },
      ],
      connections: [
        { from: { nodeId: "dots", pin: 0 }, to: { nodeId: "blur", pin: 0 } },
        { from: { nodeId: "blur", pin: 0 }, to: { nodeId: "mix", pin: 0 } },
        { from: { nodeId: "dots", pin: 0 }, to: { nodeId: "mix", pin: 1 } },
        { from: { nodeId: "mix", pin: 0 }, to: { nodeId: "out", pin: 0 } },
      ],
    },
  },

  {
    id: "liquid-silk",
    title: "Liquid Silk",
    category: "Fluid & Organic",
    blurb: "Live swirling fluid ink simulation with rich color grading and silky motion.",
    previewGradient: "linear-gradient(135deg, #0b1026 0%, #3d248a 35%, #d9468f 72%, #ff9d5c 100%)",
    patch: {
      nodes: [
        {
          id: "fluid",
          kind: "ComputeFluidSim",
          name: "Fluid Ink",
          x: 0,
          y: 0,
          params: {
            timestep: 0.16,
            curl: 24.0,
            forceStrength: 1.8,
            dyeAmount: 1.8,
            colorMode: "Dye",
          },
        },
        {
          id: "color",
          kind: "ComputeColorAdjust",
          name: "Color Grade",
          x: COL,
          y: 0,
          params: { contrast: 1.15, saturation: 1.35, brightness: 0.04 },
        },
        { id: "out", kind: "OutputFinal", x: COL * 2, y: 0, params: {} },
      ],
      connections: [
        { from: { nodeId: "fluid", pin: 0 }, to: { nodeId: "color", pin: 0 } },
        { from: { nodeId: "color", pin: 0 }, to: { nodeId: "out", pin: 0 } },
      ],
    },
  },

  {
    id: "coral-growth",
    title: "Coral Growth",
    category: "Fluid & Organic",
    blurb: "Organic reaction-diffusion coral patterns tinted in warm volcanic magma.",
    previewGradient: "linear-gradient(135deg, #12070d 0%, #6b1d3a 42%, #e06136 76%, #ffe399 100%)",
    patch: {
      nodes: [
        {
          id: "rd",
          kind: "ComputeReactionDiffusion",
          name: "Coral Sim",
          x: 0,
          y: 0,
          params: { pattern: "Coral", timestep: 1.6 },
        },
        {
          id: "palette",
          kind: "ComputeGradient",
          name: "Magma Ramp",
          x: COL,
          y: 0,
          params: {
            type: "Linear",
            colorMode: "Gradient",
            interpolation: "Smooth",
            inputMix: 1.0,
            colorStops: [
              { position: 0.0, color: [0.06, 0.03, 0.06, 1] },
              { position: 0.4, color: [0.44, 0.11, 0.24, 1] },
              { position: 0.74, color: [0.89, 0.38, 0.21, 1] },
              { position: 1.0, color: [1.0, 0.9, 0.62, 1] },
            ],
          },
        },
        { id: "out", kind: "OutputFinal", x: COL * 2, y: 0, params: {} },
      ],
      connections: [
        { from: { nodeId: "rd", pin: 0 }, to: { nodeId: "palette", pin: 0 } },
        { from: { nodeId: "palette", pin: 0 }, to: { nodeId: "out", pin: 0 } },
      ],
    },
  },

  {
    id: "starfield-drift",
    title: "Starfield Drift",
    category: "Abstract",
    blurb: "Glowing 3D-parallax particles leaving soft painterly trails across space.",
    previewGradient: "radial-gradient(circle at 60% 35%, #7dd3fc 0%, #3b4cca 35%, #12122b 75%, #05050d 100%)",
    patch: {
      nodes: [
        {
          id: "particles",
          kind: "ComputeParticles",
          name: "Star Swarm",
          x: 0,
          y: 0,
          params: {
            particleCount: 18000,
            speed: 1.3,
            size: 2.6,
            depth: 0.75,
            glow: 0.55,
            twinkle: 0.45,
            color: [0.62, 0.85, 1.0, 1.0],
          },
        },
        {
          id: "trails",
          kind: "ComputeFeedback",
          name: "Star Trails",
          x: COL,
          y: 0,
          params: { decay: 0.9, scale: 1.012, rotation: 0.4 },
        },
        { id: "out", kind: "OutputFinal", x: COL * 2, y: 0, params: {} },
      ],
      connections: [
        { from: { nodeId: "particles", pin: 0 }, to: { nodeId: "trails", pin: 0 } },
        { from: { nodeId: "trails", pin: 0 }, to: { nodeId: "out", pin: 0 } },
      ],
    },
  },

  {
    id: "cyber-glitch",
    title: "Cyber Glitch",
    category: "Glitch & Retro",
    blurb: "Electric plasma cells sliced with neon magenta-cyan color and RGB glitch.",
    previewGradient: "linear-gradient(135deg, #07051a 0%, #24126a 32%, #f43f97 68%, #22d3ee 100%)",
    patch: {
      nodes: [
        {
          id: "plasma",
          kind: "ComputeVoronoi",
          name: "Plasma Grid",
          x: 0,
          y: 0,
          params: { mode: "Borders", scale: 6.5, pointCount: 20, animate: true, speed: 0.18 },
        },
        {
          id: "neon",
          kind: "ComputeGradient",
          name: "Cyber Palette",
          x: COL,
          y: 0,
          params: {
            type: "Linear",
            colorMode: "Gradient",
            interpolation: "Smooth",
            inputMix: 1.0,
            colorStops: [
              { position: 0.0, color: [0.03, 0.02, 0.1, 1] },
              { position: 0.45, color: [0.95, 0.22, 0.58, 1] },
              { position: 0.85, color: [0.13, 0.83, 0.93, 1] },
              { position: 1.0, color: [1.0, 0.98, 1.0, 1] },
            ],
          },
        },
        {
          id: "glitch",
          kind: "ComputeGlitch",
          name: "RGB Glitch",
          x: COL * 2,
          y: 0,
          params: { type: "RGB Shift", intensity: 0.35, frequency: 0.6 },
        },
        { id: "out", kind: "OutputFinal", x: COL * 3, y: 0, params: {} },
      ],
      connections: [
        { from: { nodeId: "plasma", pin: 0 }, to: { nodeId: "neon", pin: 0 } },
        { from: { nodeId: "neon", pin: 0 }, to: { nodeId: "glitch", pin: 0 } },
        { from: { nodeId: "glitch", pin: 0 }, to: { nodeId: "out", pin: 0 } },
      ],
    },
  },

  {
    id: "neon-mosaic",
    title: "Neon Mosaic",
    category: "Geometric",
    blurb: "Hexagonal optical tiles twisted into a psychedelic rainbow vortex.",
    previewGradient: "linear-gradient(135deg, #101828 0%, #3b82f6 33%, #a855f7 66%, #f97316 100%)",
    patch: {
      nodes: [
        {
          id: "hex",
          kind: "ComputePattern",
          name: "Hex Tiles",
          x: 0,
          y: 0,
          params: { type: "Hexagon", scaleX: 12.0, scaleY: 12.0, thickness: 0.45, smoothness: 0.04 },
        },
        {
          id: "rainbow",
          kind: "ComputeGradient",
          name: "Prism Color",
          x: COL,
          y: 0,
          params: {
            type: "Radial",
            colorMode: "Rainbow",
            inputMix: 0.65,
            saturation: 0.9,
            brightness: 1.1,
            repeat: 2,
          },
        },
        {
          id: "twist",
          kind: "ComputeWarp",
          name: "Vortex Twist",
          x: COL * 2,
          y: 0,
          params: { mode: "Twist", strength: 1.4, radius: 0.85 },
        },
        { id: "out", kind: "OutputFinal", x: COL * 3, y: 0, params: {} },
      ],
      connections: [
        { from: { nodeId: "hex", pin: 0 }, to: { nodeId: "rainbow", pin: 0 } },
        { from: { nodeId: "rainbow", pin: 0 }, to: { nodeId: "twist", pin: 0 } },
        { from: { nodeId: "twist", pin: 0 }, to: { nodeId: "out", pin: 0 } },
      ],
    },
  },

  {
    id: "kinetic-type",
    title: "Kinetic Type",
    category: "Typography",
    blurb: "Bold editable poster typography bent through liquid waves and RGB split.",
    previewGradient: "linear-gradient(135deg, #141110 0%, #3a241b 45%, #d9733f 78%, #f8ede3 100%)",
    patch: {
      nodes: [
        {
          id: "uv",
          kind: "UV",
          name: "Screen UV",
          x: 0,
          y: 0,
          params: {},
        },
        {
          id: "headline",
          kind: "Text",
          name: "Headline",
          x: COL,
          y: 0,
          params: {
            text: "RHIZOMIUM",
            bold: true,
            size: 0.34,
            align: "center",
            color: [0.98, 0.94, 0.88, 1.0],
            background: [0.06, 0.05, 0.05, 1.0],
          },
        },
        {
          id: "wave",
          kind: "ComputeWarp",
          name: "Liquid Wave",
          x: COL * 2,
          y: 0,
          params: { mode: "Wave", strength: 0.35, frequency: 5.0 },
        },
        {
          id: "glitch",
          kind: "ComputeGlitch",
          name: "Chromatic Split",
          x: COL * 3,
          y: 0,
          params: { type: "RGB Shift", intensity: 0.22, frequency: 0.4 },
        },
        { id: "out", kind: "OutputFinal", x: COL * 4, y: 0, params: {} },
      ],
      connections: [
        { from: { nodeId: "uv", pin: 0 }, to: { nodeId: "headline", pin: 0 } },
        { from: { nodeId: "headline", pin: 0 }, to: { nodeId: "wave", pin: 0 } },
        { from: { nodeId: "wave", pin: 0 }, to: { nodeId: "glitch", pin: 0 } },
        { from: { nodeId: "glitch", pin: 0 }, to: { nodeId: "out", pin: 0 } },
      ],
    },
  },
];

/** One starter patch by id, or null. */
export function starterPatchById(id) {
  return STARTER_PATCHES.find((entry) => entry.id === id) || null;
}
