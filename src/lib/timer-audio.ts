let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setTimerAudioEnabled(on: boolean) {
  enabled = on;
}

export type TimerEndSoundId =
  | "default"
  | "soft-bell"
  | "deep-gong"
  | "digital-beep"
  | "success-arpeggio"
  | "zen-bowl"
  | "arcade"
  | "minimal-tick";

export const TIMER_END_SOUNDS: { id: TimerEndSoundId; label: string; shopKey?: string }[] = [
  { id: "default", label: "Default chime" },
  { id: "soft-bell", label: "Soft bell", shopKey: "sound-complete-chime" },
  { id: "deep-gong", label: "Deep gong", shopKey: "sound-deep-gong" },
  { id: "digital-beep", label: "Digital beep", shopKey: "sound-digital-beep" },
  { id: "success-arpeggio", label: "Success arpeggio", shopKey: "sound-success-arpeggio" },
  { id: "zen-bowl", label: "Zen bowl", shopKey: "sound-zen-bowl" },
  { id: "arcade", label: "Arcade", shopKey: "sound-arcade" },
  { id: "minimal-tick", label: "Minimal tick", shopKey: "sound-minimal-tick" },
];

function playTone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.15) {
  const c = getCtx();
  if (!c || !enabled) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, c.currentTime + start);
  gain.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.05);
}

function synth(id: TimerEndSoundId) {
  switch (id) {
    case "soft-bell":
      playTone(880, 0, 0.5);
      playTone(1320, 0.05, 0.4, "sine", 0.08);
      break;
    case "deep-gong":
      playTone(220, 0, 1.2, "sine", 0.2);
      playTone(110, 0, 1.4, "sine", 0.12);
      break;
    case "digital-beep":
      playTone(660, 0, 0.08, "square", 0.06);
      playTone(880, 0.12, 0.08, "square", 0.06);
      break;
    case "success-arpeggio":
      [523, 659, 784, 1047].forEach((f, i) => playTone(f, i * 0.1, 0.25, "sine", 0.1));
      break;
    case "zen-bowl":
      playTone(440, 0, 1.5, "sine", 0.12);
      playTone(660, 0.2, 1.2, "triangle", 0.06);
      break;
    case "arcade":
      [440, 554, 659, 880].forEach((f, i) => playTone(f, i * 0.06, 0.12, "square", 0.05));
      break;
    case "minimal-tick":
      playTone(1200, 0, 0.04, "sine", 0.08);
      break;
    default:
      playTone(784, 0, 0.35);
      playTone(988, 0.08, 0.3, "sine", 0.1);
  }
}

export function playTimerEndSound(id: string | undefined, soundEffectsEnabled = true) {
  if (!soundEffectsEnabled) return;
  enabled = true;
  synth((id as TimerEndSoundId) || "default");
}

export function previewTimerEndSound(id: string) {
  enabled = true;
  synth((id as TimerEndSoundId) || "default");
}

export function isTimerSoundOwned(id: TimerEndSoundId, hasUnlock: (k: string) => boolean): boolean {
  const meta = TIMER_END_SOUNDS.find((s) => s.id === id);
  if (!meta?.shopKey) return true;
  return hasUnlock(meta.shopKey);
}
