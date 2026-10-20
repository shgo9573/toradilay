"use client";

import { useEffect, useRef } from "react";
import { useFx } from "@/lib/client/fx";

function Particles({ count }: { count: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const make = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.8,
      vy: 0.12 + Math.random() * 0.34,
      vx: (Math.random() - 0.5) * 0.14,
      tw: Math.random() * Math.PI * 2,
      ts: 0.012 + Math.random() * 0.02,
      a: 0.25 + Math.random() * 0.5,
    });
    const ps = Array.from({ length: count }, make);

    const tick = () => {
      if (document.hidden) {
        raf = requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.y -= p.vy;
        p.tw += p.ts;
        p.x += p.vx + Math.sin(p.tw) * 0.08;
        if (p.y < -12) {
          p.y = h + 12;
          p.x = Math.random() * w;
        }
        const alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw * 2));
        const R = p.r * 4;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
        g.addColorStop(0, `rgba(243,220,138,${alpha.toFixed(3)})`);
        g.addColorStop(1, "rgba(243,220,138,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    let hideTimer = 0;

    const move = (e: globalThis.PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          el.style.setProperty("--sx", `${x}px`);
          el.style.setProperty("--sy", `${y}px`);
          el.classList.add("is-visible");
        });
      }
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(
        () => el.classList.remove("is-visible"),
        e.pointerType === "mouse" ? 5000 : 1100,
      );
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      window.clearTimeout(hideTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="spotlight" />;
}

/** כל שכבות הרקע. כל אחת מופעלת/מכובה בנפרד מההגדרות */
export function Background() {
  const { on, fx } = useFx();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="grid-overlay" />
      {on("aurora") && (
        <div className="aurora">
          <i />
          <i />
          <i />
        </div>
      )}
      {on("particles") && <Particles count={fx.particlesDensity} />}
      {on("spotlight") && <Spotlight />}
    </div>
  );
}
