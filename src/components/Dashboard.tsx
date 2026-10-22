"use client";
import { useEffect, useMemo, useState } from "react";
import { TOPICS } from "@/lib/topics";

export type Problem = {
  id: number; title: string; slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  premium: boolean; topic: string; youtube: string;
};

const DIFF: Record<string, string> = { Easy: "text-emerald-400", Medium: "text-amber-400", Hard: "text-rose-400" };
const todayKey = () => new Date().toLocaleDateString("en-CA");
const STORE = "dsapath-solved";

function Calendar({ solved }: { solved: Record<number, string> }) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const lead = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const counts: Record<string, number> = {};
  Object.values(solved).forEach((d) => { counts[d] = (counts[d] || 0) + 1; });
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const key = (d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="text-slate-500">{d}</span>)}
        {cells.map((d, i) => {
          const c = d ? counts[key(d)] || 0 : 0;
          const isToday = d === now.getDate();
          return (
            <span key={i} title={c ? `${c} solved` : undefined}
              className={`flex aspect-square items-center justify-center rounded ${c ? "bg-brand font-semibold text-white" : "text-slate-300"} ${isToday ? "ring-1 ring-glow" : ""}`}>
              {d ?? ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard({ problems }: { problems: Problem[] }) {
  const [topic, setTopic] = useState("All");
  const [diff, setDiff] = useState("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [solved, setSolved] = useState<Record<number, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setSolved(JSON.parse(localStorage.getItem(STORE) || "{}")); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORE, JSON.stringify(solved)); }, [solved, ready]);

  const toggle = (id: number) =>
    setSolved((s) => { const n = { ...s }; if (n[id]) delete n[id]; else n[id] = todayKey(); return n; });

  const stats = useMemo(() => {
    const t: Record<string, { done: number; total: number }> = {};
    problems.forEach((p) => {
      t[p.topic] ??= { done: 0, total: 0 };
      t[p.topic].total++;
      if (solved[p.id]) t[p.topic].done++;
    });
    return t;
  }, [problems, solved]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/^#/, "");
    const words = s.split(/\s+/).filter(Boolean);
    const res = problems.filter((p) => {
      if (diff !== "All" && p.difficulty !== diff) return false;
      if (!s) return topic === "All" || p.topic === topic;
      const title = p.title.toLowerCase();
      return String(p.id).startsWith(s) || words.every((w) => title.includes(w));
    });
    return s ? res.sort((a, b) => Number(String(b.id) === s) - Number(String(a.id) === s)) : res;
  }, [problems, topic, diff, q]);

  const doneToday = Object.values(solved).filter((d) => d === todayKey()).length;
  const current = stats[topic] ?? { done: Object.keys(solved).length, total: problems.length };
  const pick = (t: string) => { setTopic(t); setOpen(false); };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="z-30 shrink-0 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-3">
          <button className="rounded border border-line px-3 py-2 text-sm lg:hidden" onClick={() => setOpen(true)} aria-label="Open topics">Topics</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-square.png" alt="DSA Path" className="h-10 w-10 rounded-lg" />
          <span className="hidden text-lg font-bold sm:block">DSA Path</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by number or name"
            aria-label="Search questions"
            className="order-last w-full rounded border border-line bg-panel px-3 py-2 text-sm placeholder:text-slate-500 md:order-none md:w-auto md:flex-1" />
          <div className="ml-auto flex gap-2">
            <button className="rounded border border-line px-3 py-2 text-sm hover:bg-panel" title="Clerk login is the next step">Sign in</button>
            <button className="rounded bg-brand px-3 py-2 text-sm font-semibold text-white hover:opacity-90" title="Clerk login is the next step">Sign up</button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-0 w-full max-w-[1500px] flex-1 content-start gap-4 overflow-y-auto px-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)_300px] lg:overflow-hidden">
        {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-line bg-ink p-3 transition-transform lg:static lg:z-auto lg:h-full lg:w-auto lg:overflow-y-auto lg:translate-x-0 lg:rounded lg:border lg:bg-panel ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <p className="mb-2 px-2 text-sm font-semibold text-slate-400">Topics</p>
          {["All", ...TOPICS].map((t) => {
            const s = t === "All" ? { done: Object.keys(solved).length, total: problems.length } : stats[t];
            return (
              <button key={t} onClick={() => pick(t)}
                className={`flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-line ${topic === t ? "bg-line font-semibold text-white" : "text-slate-300"}`}>
                <span>{t}</span>
                <span className="text-xs text-slate-500">{s ? `${s.done}/${s.total}` : "0/0"}</span>
              </button>
            );
          })}
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="mb-3 grid shrink-0 grid-cols-3 gap-2 text-center text-xs sm:text-sm">
            {["Visitors", "Registered", "Online now"].map((l) => (
              <div key={l} className="rounded border border-line bg-panel px-2 py-2" title="Live counts need the database step">
                <div className="text-base font-semibold">–</div><div className="text-slate-400">{l}</div>
              </div>
            ))}
          </div>
          <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
            <h1 className="mr-auto text-lg font-bold">{q.trim() ? "Search results" : topic === "All" ? "All problems" : topic}</h1>
            {["All", "Easy", "Medium", "Hard"].map((d) => (
              <button key={d} onClick={() => setDiff(d)}
                className={`rounded border px-3 py-1 text-sm ${diff === d ? "border-brand bg-brand/20" : "border-line text-slate-400"}`}>{d}</button>
            ))}
          </div>
          <ul className="overflow-hidden rounded border border-line bg-panel lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {list.length === 0 && <li className="p-4 text-sm text-slate-400">No problems match. Clear the search or pick another topic.</li>}
            {list.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-line px-3 py-3 last:border-0">
                <input type="checkbox" className="h-5 w-5 shrink-0 accent-[#7c6cf6]" checked={!!solved[p.id]}
                  onChange={() => toggle(p.id)} aria-label={`Mark ${p.title} as solved`} />
                <span className="w-12 shrink-0 text-sm text-slate-500">{p.id}</span>
                <a href={`https://leetcode.com/problems/${p.slug}/`} target="_blank" rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm hover:text-glow">{p.title}{p.premium ? " 🔒" : ""}</a>
                <span className={`text-xs font-medium ${DIFF[p.difficulty]}`}>{p.difficulty}</span>
                <a href={p.youtube || `https://www.youtube.com/results?search_query=${encodeURIComponent(`leetcode ${p.id} ${p.title}`)}`}
                  target="_blank" rel="noopener noreferrer" className="text-sm text-glow" aria-label={`Watch solution for ${p.title}`}
                  title={p.youtube ? "Watch solution" : "Find solution videos"}>▶</a>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-4 lg:h-full lg:overflow-y-auto">
          <div className="rounded border border-line bg-panel p-4"><Calendar solved={solved} /></div>
          <div className="rounded border border-line bg-panel p-4">
            <p className="text-sm text-slate-400">Solved today</p>
            <p className="text-3xl font-bold">{doneToday}</p>
          </div>
          <div className="rounded border border-line bg-panel p-4">
            <p className="text-sm text-slate-400">{topic === "All" ? "Overall progress" : topic}</p>
            <p className="mb-2 text-lg font-semibold">{current.done} of {current.total} solved</p>
            <div className="h-2 rounded bg-line"><div className="h-2 rounded bg-glow" style={{ width: `${current.total ? (current.done / current.total) * 100 : 0}%` }} /></div>
          </div>
        </aside>
      </main>
    </div>
  );
}
