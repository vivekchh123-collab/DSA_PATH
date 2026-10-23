"use client";
import { useMemo, useState } from "react";
import type { Problem } from "./Dashboard";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;

export default function Calendar({
  solved,
  byId,
}: {
  solved: Record<number, string>;
  byId: Map<number, Problem>;
}) {
  const now = new Date();
  const todayKey = keyOf(now.getFullYear(), now.getMonth(), now.getDate());
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(todayKey);

  // date -> list of problem ids solved that day
  const byDate = useMemo(() => {
    const r: Record<string, number[]> = {};
    for (const [id, d] of Object.entries(solved))
      (r[d] ??= []).push(Number(id));
    return r;
  }, [solved]);

  const lead = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  const monthTotal = Array.from(
    { length: days },
    (_, i) => byDate[keyOf(view.y, view.m, i + 1)]?.length ?? 0,
  ).reduce((a, b) => a + b, 0);
  const years = Array.from(
    { length: now.getFullYear() + 2 - 2020 },
    (_, i) => 2020 + i,
  );

  const step = (delta: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const ids = [...(byDate[selected] ?? [])].sort((a, b) => a - b);
  const label = new Date(selected + "T00:00:00").toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-2 flex items-center gap-1">
        <button
          aria-label="Previous month"
          onClick={() => step(-1)}
          className="rounded px-2 py-1 text-lg hover:bg-line"
        >
          ‹
        </button>
        <select
          aria-label="Month"
          value={view.m}
          onChange={(e) =>
            setView((v) => ({ ...v, m: Number(e.target.value) }))
          }
          className="min-w-0 flex-1 rounded border border-line bg-ink px-1 py-1 text-sm"
        >
          {MONTHS.map((n, i) => (
            <option key={n} value={i}>
              {n}
            </option>
          ))}
        </select>
        <select
          aria-label="Year"
          value={view.y}
          onChange={(e) =>
            setView((v) => ({ ...v, y: Number(e.target.value) }))
          }
          className="rounded border border-line bg-ink px-1 py-1 text-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          aria-label="Next month"
          onClick={() => step(1)}
          className="rounded px-2 py-1 text-lg hover:bg-line"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="text-slate-500">
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const k = keyOf(view.y, view.m, d);
          const c = byDate[k]?.length ?? 0;
          return (
            <button
              key={i}
              onClick={() => setSelected(k)}
              title={c ? `${c} solved` : undefined}
              className={`flex aspect-square flex-col items-center justify-center rounded text-xs
                ${c >= 4 ? "bg-brand font-semibold text-white" : c ? "bg-brand/60 font-semibold text-white" : "text-slate-300 hover:bg-line"}
                ${k === todayKey ? "ring-1 ring-glow" : ""} ${k === selected ? "outline outline-2 outline-white" : ""}`}
            >
              {d}
              {c > 0 && (
                <span className="text-[9px] leading-none opacity-80">{c}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>
          {monthTotal} solved in {MONTHS[view.m]}
        </span>
        <button
          className="text-glow hover:underline"
          onClick={() => {
            setView({ y: now.getFullYear(), m: now.getMonth() });
            setSelected(todayKey);
          }}
        >
          Today
        </button>
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-slate-400">
          {ids.length} {ids.length === 1 ? "question" : "questions"} solved
        </p>
        <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm">
          {ids.map((id) => {
            const p = byId.get(id);
            return p ? (
              <li key={id}>
                <a
                  href={`https://leetcode.com/problems/${p.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-glow"
                >
                  {p.id}. {p.title}
                </a>
              </li>
            ) : null;
          })}
        </ul>
      </div>
    </div>
  );
}
