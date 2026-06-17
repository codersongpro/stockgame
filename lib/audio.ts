// Lightweight sound engine using the Web Audio API for synthesised SFX.
// Respects a global mute flag persisted in localStorage.

type Sfx =
  | "click"
  | "buy"
  | "sell"
  | "build"
  | "hire"
  | "turn"
  | "good"
  | "bad"
  | "win";

let ctx: AudioContext | null = null;
let muted = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function initAudio(): void {
  if (typeof window === "undefined") return;
  muted = window.localStorage.getItem("uc-muted") === "1";
  ensureCtx();
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem("uc-muted", value ? "1" : "0");
  }
}

function tone(freq: number, durMs: number, type: OscillatorType, gain: number, delay = 0): void {
  const c = ensureCtx();
  if (!c || muted) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = c.currentTime + delay;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + durMs / 1000);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + durMs / 1000 + 0.02);
}

export function playSfx(name: Sfx): void {
  if (muted) return;
  switch (name) {
    case "click":
      tone(420, 60, "triangle", 0.05);
      break;
    case "buy":
      tone(523, 90, "sine", 0.08);
      tone(784, 110, "sine", 0.06, 0.06);
      break;
    case "sell":
      tone(659, 90, "sine", 0.08);
      tone(440, 110, "sine", 0.06, 0.06);
      break;
    case "build":
      tone(300, 80, "square", 0.05);
      tone(360, 120, "square", 0.05, 0.07);
      break;
    case "hire":
      tone(587, 90, "triangle", 0.07);
      tone(880, 130, "triangle", 0.06, 0.08);
      break;
    case "turn":
      tone(392, 100, "sine", 0.06);
      tone(523, 120, "sine", 0.05, 0.08);
      break;
    case "good":
      [523, 659, 784].forEach((f, i) => tone(f, 140, "sine", 0.07, i * 0.07));
      break;
    case "bad":
      [392, 311].forEach((f, i) => tone(f, 180, "sawtooth", 0.06, i * 0.08));
      break;
    case "win":
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 200, "triangle", 0.08, i * 0.1));
      break;
  }
}

