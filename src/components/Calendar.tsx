"use client";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

type Diff = "Easy" | "Medium" | "Hard";
const ORDER: Diff[] = ["Easy", "Medium", "Hard"];
const TEXT: Record<Diff, string> = {
  Easy: "text-emerald-400",
  Medium: "text-amber-400",
  Hard: "text-rose-400",
};

// 5 shades per level, listed from DEEPEST to LIGHTEST
const SHADES: Record<Diff, string[]> = {
  Easy: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"],
  Medium: ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7"],
  Hard: ["#f43f5e", "#fb7185", "#fda4af", "#fecdd3", "#ffe4e6"],
};
const MAX_LEVELS = 5;
// true  = 1 question is the lightest, 5 or more is the deepest (current setting)
// false = 1 question is the deepest, 5 or more is the lightest
const MORE_IS_DARKER = true;

const shadeIndex = (n: number) => (MORE_IS_DARKER ? MAX_LEVELS - n : n - 1);

// how many Easy / Medium / Hard problems are in this list of ids
const tally = (ids: number[], byId: Map<number, Problem>) => {
  const t: Record<Diff, number> = { Easy: 0, Medium: 0, Hard: 0 };
  ids.forEach((id) => {
    const p = byId.get(id);
    if (p) t[p.difficulty]++;
  });
  return t;
};

// The look of one day: colour from difficulty, strength from how many were solved
const dayLook = (
  ids: number[] | undefined,
  byId: Map<number, Problem>,
): CSSProperties | undefined => {
  if (!ids?.length) return undefined;
  const per = tally(ids, byId);
  const kinds = ORDER.filter((d) => per[d] > 0);
  if (!kinds.length) return undefined;

  const n = Math.min(ids.length, MAX_LEVELS);
  const cols = kinds.map((d) => SHADES[d][shadeIndex(n)]);
  const part = 100 / cols.length; // 2 levels = halves, 3 levels = thirds
  const background =
    cols.length === 1
      ? cols[0]
      : `linear-gradient(135deg, ${cols
          .map((c, i) => `${c} ${i * part}% ${(i + 1) * part}%`)
          .join(", ")})`;

  return {
    background,
    color: "#0b1020",
    boxShadow: `0 0 ${3 + n * 2}px ${cols[0]}99`,
  };
};

export default function Calendar({
  solved,
  byId,
  selected,
  onSelect,
}: {
  solved: Record<number, string>;
  byId: Map<number, Problem>;
  selected: string;
  onSelect: (key: string) => void;
}) {
  const now = new Date();
  const todayKey = keyOf(now.getFullYear(), now.getMonth(), now.getDate());
  const [view, setView] = useState(() => {
    const [y, m] = selected.split("-").map(Number);
    return { y, m: m - 1 };
  });

  // when the selected date changes from outside (e.g. "Back to today"), jump to its month
  useEffect(() => {
    const [y, m] = selected.split("-").map(Number);
    setView({ y, m: m - 1 });
  }, [selected]);

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
  const LAST_YEAR = now.getFullYear() + 11;
  const years = Array.from(
    { length: LAST_YEAR - 2020 + 1 },
    (_, i) => 2020 + i,
  );

  const step = (delta: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const ids = [...(byDate[selected] ?? [])].sort((a, b) => a - b);
  const sel = tally(ids, byId);
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
          const dayIds = byDate[k];
          const c = dayIds?.length ?? 0;
          const look = dayLook(dayIds, byId);
          const t = c ? tally(dayIds, byId) : null;
          const tip = t
            ? `${c} solved: ${ORDER.filter((x) => t[x])
                .map((x) => `${t[x]} ${x}`)
                .join(", ")}`
            : undefined;
          return (
            <button
              key={i}
              onClick={() => onSelect(k)}
              style={look}
              title={tip}
              className={`flex aspect-square flex-col items-center justify-center rounded text-xs
                ${c ? "font-semibold" : "text-slate-300 hover:bg-line"} ${c && !look ? "bg-brand/60 text-white" : ""}
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
          onClick={() => onSelect(todayKey)}
        >
          Today
        </button>
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-slate-400">
          {ids.length} {ids.length === 1 ? "question" : "questions"} solved
        </p>
        {ids.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
            {ORDER.filter((d) => sel[d]).map((d) => (
              <span key={d} className={TEXT[d]}>
                {sel[d]} {d}
              </span>
            ))}
          </p>
        )}
        <p className="mt-1 text-xs text-glow">
          {selected > todayKey
            ? "You can’t tick problems on a future date."
            : "Problems you tick now are counted on this date."}
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
                  {p.id}. {p.title}{" "}
                  <span className={`text-xs ${TEXT[p.difficulty]}`}>
                    {p.difficulty}
                  </span>
                </a>
              </li>
            ) : null;
          })}
        </ul>
      </div>
    </div>
  );
}
