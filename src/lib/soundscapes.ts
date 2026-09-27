/**
 * Focus soundscapes — synthesized with the Web Audio API, no audio assets.
 *
 * Usage: startSoundscape(id, volume) must be called from (or after) a user gesture the first
 * time so the AudioContext is allowed to run. stopSoundscape() tears the graph down.
 */

export type SoundscapeId =
  | "off"
  | "white"
  | "brown"
  | "rain"
  | "cafe"
  | "lofi"
  | "liquid-pad"
  | "liquid-rain"
  | "liquid-flow";

export const SOUNDSCAPES: { id: SoundscapeId; name: string; hint: string }[] = [
  { id: "off", name: "Off", hint: "Silence" },
  { id: "white", name: "White noise", hint: "Even hiss" },
  { id: "brown", name: "Brown noise", hint: "Deep rumble" },
  { id: "rain", name: "Rain", hint: "Soft drips" },
  { id: "cafe", name: "Café hum", hint: "Warm murmur" },
  { id: "lofi", name: "Lo-fi pad", hint: "Slow chords" },
  { id: "liquid-pad", name: "Liquid pad", hint: "Glossy ambient swell" },
  { id: "liquid-rain", name: "Liquid rain", hint: "Smooth drizzle bed" },
  { id: "liquid-flow", name: "Liquid flow", hint: "Slow pulse & shimmer" },
];

type Graph = {
  id: SoundscapeId;
  master: GainNode;
  nodes: AudioNode[];
  timers: number[];
};

let ctx: AudioContext | null = null;
let graph: Graph | null = null;
let currentVolume = 0.5;
/** Bumped on every start/stop so pending previews can tell if a real start superseded them. */
let generation = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/** 4-second looping noise buffer. `brown` integrates white noise for a low rumble. */
function noiseBuffer(ac: AudioContext, kind: "white" | "brown" | "pink"): AudioBuffer {
  const seconds = 4;
  const buf = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === "white") data[i] = w * 0.5;
    else if (kind === "brown") {
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    } else {
      // cheap pink approximation (Paul Kellet)
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.15;
    }
  }
  return buf;
}

function loopSource(ac: AudioContext, buf: AudioBuffer): AudioBufferSourceNode {
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.start();
  return src;
}

function volumeCurve(v: number): number {
  const c = Math.min(1, Math.max(0, v));
  return c * c; // perceptual-ish
}

function buildGraph(ac: AudioContext, id: SoundscapeId, master: GainNode): Graph {
  const nodes: AudioNode[] = [];
  const timers: number[] = [];

  switch (id) {
    case "white": {
      const src = loopSource(ac, noiseBuffer(ac, "white"));
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 9000;
      const g = ac.createGain();
      g.gain.value = 0.35;
      src.connect(lp).connect(g).connect(master);
      nodes.push(src, lp, g);
      break;
    }
    case "brown": {
      const src = loopSource(ac, noiseBuffer(ac, "brown"));
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 500;
      const g = ac.createGain();
      g.gain.value = 0.6;
      src.connect(lp).connect(g).connect(master);
      nodes.push(src, lp, g);
      break;
    }
    case "liquid-rain":
    case "rain": {
      // steady rain bed: pink noise, band-passed
      const bed = loopSource(ac, noiseBuffer(ac, "pink"));
      const bp = ac.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800;
      bp.Q.value = 0.6;
      const hp = ac.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 400;
      const bedGain = ac.createGain();
      bedGain.gain.value = 0.5;
      bed.connect(bp).connect(hp).connect(bedGain).connect(master);
      nodes.push(bed, bp, hp, bedGain);

      // random drips: short filtered noise bursts
      const dripBuf = noiseBuffer(ac, "white");
      const dripBus = ac.createGain();
      dripBus.gain.value = 0.9;
      dripBus.connect(master);
      nodes.push(dripBus);
      const drip = () => {
        if (!graph || graph.id !== "rain") return;
        const s = ac.createBufferSource();
        s.buffer = dripBuf;
        const f = ac.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 2500 + Math.random() * 4000;
        f.Q.value = 6;
        const g = ac.createGain();
        const t = ac.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25 + Math.random() * 0.3, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06 + Math.random() * 0.08);
        s.connect(f).connect(g).connect(dripBus);
        s.start(t, Math.random() * 3);
        s.stop(t + 0.25);
        timers.push(window.setTimeout(drip, 60 + Math.random() * 260));
      };
      timers.push(window.setTimeout(drip, 200));
      break;
    }
    case "cafe": {
      // low murmur: brown noise band-passed around speech fundamentals, gently modulated
      const src = loopSource(ac, noiseBuffer(ac, "brown"));
      const bp = ac.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 320;
      bp.Q.value = 0.9;
      const g = ac.createGain();
      g.gain.value = 0.55;
      const lfo = ac.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.13;
      const lfoGain = ac.createGain();
      lfoGain.gain.value = 0.18;
      lfo.connect(lfoGain).connect(g.gain);
      lfo.start();
      // a second, slower sweep on the filter so the "room" breathes
      const lfo2 = ac.createOscillator();
      lfo2.frequency.value = 0.05;
      const lfo2Gain = ac.createGain();
      lfo2Gain.gain.value = 90;
      lfo2.connect(lfo2Gain).connect(bp.frequency);
      lfo2.start();
      // light high "clatter" layer
      const hiss = loopSource(ac, noiseBuffer(ac, "pink"));
      const hp = ac.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 2400;
      const hissGain = ac.createGain();
      hissGain.gain.value = 0.06;
      hiss.connect(hp).connect(hissGain).connect(master);
      src.connect(bp).connect(g).connect(master);
      nodes.push(src, bp, g, lfo, lfoGain, lfo2, lfo2Gain, hiss, hp, hissGain);
      break;
    }
    case "liquid-pad":
    case "lofi": {
      // detuned oscillator pad on a slow chord cycle, lowpassed, tremolo LFO
      const chords = [
        [130.81, 164.81, 196.0, 246.94], // Cmaj7
        [110.0, 130.81, 164.81, 196.0], // Am7
        [146.83, 174.61, 220.0, 261.63], // Dm7
        [98.0, 123.47, 146.83, 174.61], // G7
      ];
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      lp.Q.value = 0.7;
      const padGain = ac.createGain();
      padGain.gain.value = 0.16;
      const trem = ac.createOscillator();
      trem.frequency.value = 0.35;
      const tremGain = ac.createGain();
      tremGain.gain.value = 0.04;
      trem.connect(tremGain).connect(padGain.gain);
      trem.start();
      lp.connect(padGain).connect(master);
      nodes.push(lp, padGain, trem, tremGain);

      const voices: { osc: OscillatorNode; det: OscillatorNode }[] = [];
      for (let i = 0; i < 4; i++) {
        const osc = ac.createOscillator();
        osc.type = "triangle";
        const det = ac.createOscillator();
        det.type = "sawtooth";
        det.detune.value = 7 + i * 2;
        const vg = ac.createGain();
        vg.gain.value = 0.25;
        const dg = ac.createGain();
        dg.gain.value = 0.08;
        osc.connect(vg).connect(lp);
        det.connect(dg).connect(lp);
        osc.start();
        det.start();
        voices.push({ osc, det });
        nodes.push(osc, det, vg, dg);
      }
      let step = 0;
      const applyChord = () => {
        if (!graph || graph.id !== "lofi") return;
        const chord = chords[step % chords.length];
        const t = ac.currentTime;
        voices.forEach((v, i) => {
          v.osc.frequency.setTargetAtTime(chord[i], t, 0.4);
          v.det.frequency.setTargetAtTime(chord[i], t, 0.4);
        });
        step += 1;
        timers.push(window.setTimeout(applyChord, 8000));
      };
      applyChord();
      // vinyl-ish crackle
      const crackle = loopSource(ac, noiseBuffer(ac, "white"));
      const chp = ac.createBiquadFilter();
      chp.type = "highpass";
      chp.frequency.value = 3000;
      const cg = ac.createGain();
      cg.gain.value = 0.015;
      crackle.connect(chp).connect(cg).connect(master);
      nodes.push(crackle, chp, cg);
      break;
    }
    case "liquid-flow": {
      const src = loopSource(ac, noiseBuffer(ac, "pink"));
      const bp = ac.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 520;
      bp.Q.value = 1.2;
      const g = ac.createGain();
      g.gain.value = 0.42;
      const lfo = ac.createOscillator();
      lfo.frequency.value = 0.08;
      const lfoG = ac.createGain();
      lfoG.gain.value = 0.12;
      lfo.connect(lfoG).connect(g.gain);
      lfo.start();
      src.connect(bp).connect(g).connect(master);
      nodes.push(src, bp, g, lfo, lfoG);
      break;
    }
    case "off":
    default:
      break;
  }

  return { id, master, nodes, timers };
}

function teardown(g: Graph): void {
  g.timers.forEach((t) => window.clearTimeout(t));
  g.nodes.forEach((n) => {
    try {
      if ("stop" in n && typeof (n as AudioScheduledSourceNode).stop === "function") {
        (n as AudioScheduledSourceNode).stop();
      }
      n.disconnect();
    } catch {
      /* already stopped */
    }
  });
  try {
    g.master.disconnect();
  } catch {
    /* ignore */
  }
}

export function currentSoundscape(): SoundscapeId | null {
  return graph?.id ?? null;
}

export async function startSoundscape(id: SoundscapeId, volume = currentVolume): Promise<void> {
  generation += 1;
  currentVolume = volume;
  if (id === "off") {
    stopSoundscape();
    return;
  }
  const ac = getCtx();
  if (!ac) return;
  try {
    if (ac.state === "suspended") await ac.resume();
  } catch {
    /* will retry on next gesture */
  }
  if (graph && graph.id === id) {
    setSoundscapeVolume(volume);
    return;
  }
  if (graph) {
    const old = graph;
    graph = null;
    // short fade to avoid clicks
    old.master.gain.setTargetAtTime(0, ac.currentTime, 0.05);
    window.setTimeout(() => teardown(old), 220);
  }
  const master = ac.createGain();
  master.gain.value = 0;
  master.connect(ac.destination);
  graph = buildGraph(ac, id, master);
  master.gain.setTargetAtTime(volumeCurve(volume), ac.currentTime, 0.4);
}

export function stopSoundscape(): void {
  generation += 1;
  if (!graph) return;
  const old = graph;
  graph = null;
  if (ctx) {
    old.master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    window.setTimeout(() => teardown(old), 300);
  } else {
    teardown(old);
  }
}

export function setSoundscapeVolume(v: number): void {
  currentVolume = Math.min(1, Math.max(0, v));
  if (graph && ctx) graph.master.gain.setTargetAtTime(volumeCurve(currentVolume), ctx.currentTime, 0.08);
}

/** Preview a soundscape briefly (e.g. when tapping a chip while the timer isn't running). */
export async function previewSoundscape(id: SoundscapeId, volume: number, ms = 3000): Promise<void> {
  await startSoundscape(id, volume);
  const gen = generation;
  window.setTimeout(() => {
    // A real start (timer began) or explicit stop since → leave it alone.
    if (generation === gen && graph?.id === id) stopSoundscape();
  }, ms);
}
