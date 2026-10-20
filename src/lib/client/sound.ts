export type SoundKind = "key" | "delete" | "clear" | "click" | "found" | "success" | "error";

let ctx: AudioContext | null = null;
let enabled = false;
let volume = 0.4;

export function configureSound(on: boolean, volumePercent: number) {
  enabled = on;
  volume = Math.max(0, Math.min(1, volumePercent / 100));
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  gainPeak = 0.18,
  slideTo?: number,
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + start + dur);
  }
  const peak = gainPeak * volume;
  gain.gain.setValueAtTime(0.0001, c.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), c.currentTime + start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.05);
}

/** מנגן צליל קצר ועדין (נוצר בדפדפן, ללא קבצי שמע) */
export function playSound(kind: SoundKind) {
  if (!enabled || volume <= 0) return;
  const c = getCtx();
  if (!c) return;

  switch (kind) {
    case "key":
      tone(c, 780, 0, 0.07, "triangle", 0.16, 560);
      break;
    case "delete":
      tone(c, 420, 0, 0.09, "triangle", 0.14, 300);
      break;
    case "clear":
      tone(c, 520, 0, 0.08, "triangle", 0.14, 260);
      tone(c, 340, 0.07, 0.1, "triangle", 0.12, 200);
      break;
    case "click":
      tone(c, 620, 0, 0.06, "sine", 0.14);
      break;
    case "found":
      tone(c, 660, 0, 0.12, "sine", 0.16);
      tone(c, 880, 0.1, 0.16, "sine", 0.16);
      break;
    case "success":
      tone(c, 660, 0, 0.12, "sine", 0.17);
      tone(c, 830, 0.09, 0.12, "sine", 0.17);
      tone(c, 1100, 0.18, 0.22, "sine", 0.17);
      break;
    case "error":
      tone(c, 240, 0, 0.16, "sawtooth", 0.1, 170);
      tone(c, 200, 0.14, 0.2, "sawtooth", 0.1, 130);
      break;
  }
}
