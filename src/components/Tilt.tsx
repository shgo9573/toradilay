"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { useFx } from "@/lib/client/fx";

/** הטיית תלת-מימד עם ברק משתקף. פועלת רק עם עכבר, ורק כשהאפקט פעיל */
export function Tilt({
  children,
  className = "",
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const { on } = useFx();
  const ref = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);

  if (!on("tilt")) return <div className={className}>{children}</div>;

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.transition = "transform 0.12s ease-out";
    el.style.transform = `perspective(900px) rotateX(${((0.5 - py) * max * 2).toFixed(2)}deg) rotateY(${((px - 0.5) * max * 2).toFixed(2)}deg) scale(1.015)`;
    if (glare.current) {
      glare.current.style.opacity = "1";
      glare.current.style.background = `radial-gradient(420px circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.16), transparent 55%)`;
    }
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)";
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    if (glare.current) glare.current.style.opacity = "0";
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={`relative will-change-transform ${className}`}
    >
      {children}
      <div
        ref={glare}
        className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] opacity-0 transition-opacity duration-300"
      />
    </div>
  );
}
