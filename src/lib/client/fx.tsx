"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { EffectKey, EffectsConfig } from "@/lib/types";
import { FULL_EFFECTS } from "@/lib/defaults";
import { configureSound } from "./sound";

interface FxContextValue {
  fx: EffectsConfig;
  /** האם אפקט מסוים פעיל בפועל (מתג ראשי + מתג האפקט) */
  on: (key: EffectKey) => boolean;
}

const FxContext = createContext<FxContextValue>({
  fx: FULL_EFFECTS,
  on: () => true,
});

const KEYS: EffectKey[] = [
  "aurora",
  "particles",
  "spotlight",
  "glass",
  "pageTransitions",
  "stagger",
  "tilt",
  "shimmer",
  "ripple",
  "glowInput",
  "logoAnimation",
  "countdownRing",
  "confetti",
  "sounds",
];

/** מחלקות CSS ששמות את האפקטים הפעילים על שורש האפליקציה */
export function effectClasses(fx: EffectsConfig): string {
  if (!fx.master) return "fx-off";
  return KEYS.filter((k) => fx[k])
    .map((k) => `fx-${k}`)
    .join(" ");
}

export function FxProvider({
  effects,
  children,
}: {
  effects: EffectsConfig;
  children: ReactNode;
}) {
  const value = useMemo<FxContextValue>(
    () => ({
      fx: effects,
      on: (key) => effects.master && Boolean(effects[key]),
    }),
    [effects],
  );

  useEffect(() => {
    configureSound(effects.master && effects.sounds, effects.soundVolume);
  }, [effects.master, effects.sounds, effects.soundVolume]);

  return <FxContext.Provider value={value}>{children}</FxContext.Provider>;
}

export function useFx() {
  return useContext(FxContext);
}

/** קונפטי זהוב ונייבי (נטען בעצלות רק כשצריך) */
export async function fireConfetti(origin?: { x: number; y: number }) {
  try {
    const mod = await import("canvas-confetti");
    const confetti = mod.default;
    const colors = ["#f3dc8a", "#e5be53", "#c59b27", "#ffffff", "#2a4688"];
    const o = origin ?? { x: 0.5, y: 0.65 };
    confetti({
      particleCount: 70,
      spread: 70,
      startVelocity: 42,
      origin: o,
      colors,
      zIndex: 100,
      scalar: 0.95,
    });
    window.setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 110,
        startVelocity: 28,
        origin: o,
        colors,
        zIndex: 100,
        scalar: 0.8,
      });
    }, 160);
  } catch {
    /* ignore */
  }
}
