"use client";

import type { ReactNode } from "react";

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      dir="ltr"
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-gold-300/60 bg-gradient-to-r from-gold-600 to-gold-400 shadow-[0_0_18px_-4px_rgba(229,190,83,0.7)]"
          : "border-white/15 bg-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-200 ${
          checked ? "left-[calc(100%-1.625rem)]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function SectionCard({
  title,
  icon,
  hint,
  children,
  action,
}: {
  title: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-white">
            {icon}
            {title}
          </h4>
          {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  children,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 transition-colors ${
        checked ? "border-gold-400/30 bg-gold-400/[0.06]" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-white">{title}</div>
          {description && <div className="mt-0.5 text-xs leading-snug text-slate-400">{description}</div>}
        </div>
        <Switch checked={checked} onChange={onChange} label={title} disabled={disabled} />
      </div>
      {children}
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-white/15 bg-navy-950/60 px-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#e5be53]"
    />
  );
}
