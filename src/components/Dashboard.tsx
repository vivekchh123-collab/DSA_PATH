"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { TOPICS } from "@/lib/topics";
import Calendar from "@/components/Calendar";

export type Problem = {
  id: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  premium: boolean;
  topic: string;
  youtube: string;
};
type Counts = {
  visitors: number | null;
  online: number | null;
  registered: number | null;
};
type Tally = { done: number; total: number };

const DIFF: Record<string, string> = {
  Easy: "text-emerald-400",
  Medium: "text-amber-400",
  Hard: "text-rose-400",
};
const STORE = "dsapath-solved";
const STRONG_AT = 25; // solved problems in a topic to be called "Strong"
const GOOD_AT = 10; // ... and "Good"
const todayKey = () => new Date().toLocaleDateString("en-CA");
const pct = (d: number, t: number) => `${t ? (d / t) * 100 : 0}%`;
const level = (n: number): [string, string] =>
  n >= STRONG_AT
    ? ["Strong", "text-emerald-400"]
    : n >= GOOD_AT
      ? ["Good", "text-amber-400"]
      : ["Learning", "text-slate-400"];
const lcUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;
const ytUrl = (p: Problem) =>
  p.youtube ||
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`leetcode ${p.id} ${p.title}`)}`;

export default function Dashboard({ problems }: { problems: Problem[] }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [topic, setTopic] = useState("All");
  const [diff, setDiff] = useState("All");
  const [q, setQ] = useState("");
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [tab, setTab] = useState<"calendar" | "skills">("calendar");
  const [solved, setSolved] = useState<Record<number, string>>({});
  const [counts, setCounts] = useState<Counts | null>(null);

  // Ticks: from Supabase when signed in, from this browser when signed out
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      fetch("/api/progress")
        .then((r) => r.json())
        .then((d) => setSolved(d.solved ?? {}))
        .catch(() => {});
    } else {
      try {
        setSolved(JSON.parse(localStorage.getItem(STORE) || "{}"));
      } catch {
        /* ignore */
      }
    }
  }, [isLoaded, isSignedIn]);

  // Visitors, online and registered counts
  useEffect(() => {
    let id = localStorage.getItem("dsapath-vid");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("dsapath-vid", id);
    }
    const ping = () =>
      fetch("/api/ping", { method: "POST", body: JSON.stringify({ id }) })
        .then((r) => r.json())
        .then((d) => {
          if (!d.error) setCounts(d);
        })
        .catch(() => {});
    ping();
    const t = setInterval(() => {
      if (!document.hidden) ping();
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const toggle = (id: number) => {
    const nowSolved = !solved[id];
    const day = todayKey();
    const next = { ...solved };
    if (nowSolved) next[id] = day;
    else delete next[id];
    setSolved(next);
    if (!isSignedIn) {
      localStorage.setItem(STORE, JSON.stringify(next));
      return;
    }
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId: id, solved: nowSolved, solvedOn: day }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("save failed");
      })
      .catch(() =>
        setSolved((s) => {
          const n = { ...s };
          if (nowSolved) delete n[id];
          else n[id] = day;
          return n;
        }),
      );
  };

  const byId = useMemo(
    () => new Map(problems.map((p) => [p.id, p] as const)),
    [problems],
  );

  const topicStats = useMemo(() => {
    const t: Record<string, Tally> = {};
    problems.forEach((p) => {
      t[p.topic] ??= { done: 0, total: 0 };
      t[p.topic].total++;
      if (solved[p.id]) t[p.topic].done++;
    });
    return t;
  }, [problems, solved]);

  const diffStats = useMemo(() => {
    const t: Record<string, Tally> = {
      Easy: { done: 0, total: 0 },
      Medium: { done: 0, total: 0 },
      Hard: { done: 0, total: 0 },
    };
    problems.forEach((p) => {
      t[p.difficulty].total++;
      if (solved[p.id]) t[p.difficulty].done++;
    });
    return t;
  }, [problems, solved]);

  const skills = useMemo(
    () =>
      Object.entries(topicStats)
        .filter(([, s]) => s.done > 0)
        .sort((a, b) => b[1].done - a[1].done)
        .slice(0, 6),
    [topicStats],
  );

  const today = todayKey();
  const todayList = useMemo(
    () => problems.filter((p) => solved[p.id] === today),
    [problems, solved, today],
  );
  const totalDone = Object.keys(solved).length;
  const current: Tally =
    topic === "All"
      ? { done: totalDone, total: problems.length }
      : (topicStats[topic] ?? { done: 0, total: 0 });

  const list = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/^#/, "");
    const words = s.split(/\s+/).filter(Boolean);
    const res = problems.filter((p) => {
      if (diff !== "All" && p.difficulty !== diff) return false;
      if (!s) return topic === "All" || p.topic === topic;
      const title = p.title.toLowerCase();
      return (
        String(p.id).startsWith(s) || words.every((w) => title.includes(w))
      );
    });
    return s
      ? res.sort(
          (a, b) => Number(String(b.id) === s) - Number(String(a.id) === s),
        )
      : res;
  }, [problems, topic, diff, q]);

  const closeAll = () => {
    setLeftOpen(false);
    setRightOpen(false);
  };
  const pick = (t: string) => {
    setTopic(t);
    setLeftOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="z-30 shrink-0 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-square.png"
            alt="DSA Path"
            className="h-10 w-10 rounded-lg"
          />
          <span className="hidden text-lg font-bold sm:block">DSA Path</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by number or name"
            aria-label="Search questions"
            className="order-last w-full rounded border border-line bg-panel px-3 py-2 text-sm placeholder:text-slate-500 md:order-none md:w-auto md:flex-1"
          />
          <div className="ml-auto flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded border border-line px-3 py-2 text-sm hover:bg-panel">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded bg-brand px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-0 w-full max-w-[1500px] flex-1 content-start gap-4 overflow-y-auto px-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)_300px] lg:overflow-hidden">
        {(leftOpen || rightOpen) && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={closeAll}
          />
        )}

        {/* LEFT: topics (a slide-in panel on phones) */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-line bg-ink p-3 transition-[transform,visibility] duration-200 lg:static lg:z-auto lg:h-full lg:w-auto lg:translate-x-0 lg:rounded lg:border lg:bg-panel ${leftOpen ? "translate-x-0" : "-translate-x-full max-lg:invisible"}`}
        >
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-sm font-semibold text-slate-400">Topics</p>
            <button
              className="rounded border border-line px-2 py-1 text-xs lg:hidden"
              onClick={() => setLeftOpen(false)}
            >
              Close
            </button>
          </div>
          {["All", ...TOPICS].map((t) => {
            const s =
              t === "All"
                ? { done: totalDone, total: problems.length }
                : topicStats[t];
            return (
              <button
                key={t}
                onClick={() => pick(t)}
                className={`flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-line ${topic === t ? "bg-line font-semibold text-white" : "text-slate-300"}`}
              >
                <span>{t}</span>
                <span className="text-xs text-slate-500">
                  {s ? `${s.done}/${s.total}` : "0/0"}
                </span>
              </button>
            );
          })}
        </aside>

        {/* MIDDLE: problems */}
        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="mb-3 flex shrink-0 gap-2 lg:hidden">
            <button
              onClick={() => setLeftOpen(true)}
              className="min-w-0 flex-1 truncate rounded border border-line bg-panel px-3 py-2 text-left text-sm"
            >
              ☰ {topic === "All" ? "Topics" : topic}
            </button>
            <button
              onClick={() => setRightOpen(true)}
              className="flex-1 rounded border border-line bg-panel px-3 py-2 text-sm"
            >
              📅 Progress
            </button>
          </div>

          <div className="mb-3 grid shrink-0 grid-cols-3 gap-2 text-center text-xs sm:text-sm">
            {(
              [
                ["Visitors", counts?.visitors],
                ["Registered", counts?.registered],
                ["Online now", counts?.online],
              ] as [string, number | null | undefined][]
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded border border-line bg-panel px-2 py-2"
              >
                <div className="text-base font-semibold">{value ?? "–"}</div>
                <div className="text-slate-400">{label}</div>
              </div>
            ))}
          </div>

          <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
            <h1 className="mr-auto text-lg font-bold">
              {q.trim()
                ? "Search results"
                : topic === "All"
                  ? "All problems"
                  : topic}
            </h1>
            {["All", "Easy", "Medium", "Hard"].map((d) => (
              <button
                key={d}
                onClick={() => setDiff(d)}
                className={`rounded border px-3 py-1 text-sm ${diff === d ? "border-brand bg-brand/20" : "border-line text-slate-400"}`}
              >
                {d}
              </button>
            ))}
          </div>

          <ul className="overflow-hidden rounded border border-line bg-panel lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {list.length === 0 && (
              <li className="p-4 text-sm text-slate-400">
                No problems match. Clear the search or pick another topic.
              </li>
            )}
            {list.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 border-b border-line px-3 py-3 last:border-0"
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 accent-[#7c6cf6]"
                  checked={!!solved[p.id]}
                  onChange={() => toggle(p.id)}
                  aria-label={`Mark ${p.title} as solved`}
                />
                <span className="w-12 shrink-0 text-sm text-slate-500">
                  {p.id}
                </span>
                <a
                  href={lcUrl(p.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm hover:text-glow"
                >
                  {p.title}
                  {p.premium ? " 🔒" : ""}
                </a>
                <span className={`text-xs font-medium ${DIFF[p.difficulty]}`}>
                  {p.difficulty}
                </span>
                <a
                  href={ytUrl(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-glow"
                  aria-label={`Watch solution for ${p.title}`}
                  title={p.youtube ? "Watch solution" : "Find solution videos"}
                >
                  ▶
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* RIGHT: progress (a slide-in panel on phones) */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[90vw] space-y-4 overflow-y-auto border-l border-line bg-ink p-3 transition-[transform,visibility] duration-200 lg:static lg:z-auto lg:h-full lg:w-auto lg:max-w-none lg:translate-x-0 lg:border-0 lg:bg-transparent lg:p-0 ${rightOpen ? "translate-x-0" : "translate-x-full max-lg:invisible"}`}
        >
          <div className="flex items-center justify-between lg:hidden">
            <p className="text-sm font-semibold text-slate-400">Progress</p>
            <button
              className="rounded border border-line px-2 py-1 text-xs"
              onClick={() => setRightOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="rounded border border-line bg-panel p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-slate-400">Solved today</p>
              <p className="text-3xl font-bold">{todayList.length}</p>
            </div>
            {todayList.length > 0 && (
              <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-sm">
                {todayList.map((p) => (
                  <li key={p.id}>
                    <a
                      href={lcUrl(p.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-glow"
                    >
                      {p.id}. {p.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded border border-line bg-panel p-4">
            <p className="text-sm text-slate-400">
              {topic === "All" ? "Overall progress" : topic}
            </p>
            <p className="mb-2 text-lg font-semibold">
              {current.done} of {current.total} solved
            </p>
            <div className="h-2 rounded bg-line">
              <div
                className="h-2 rounded bg-glow"
                style={{ width: pct(current.done, current.total) }}
              />
            </div>
          </div>

          <div className="rounded border border-line bg-panel p-4">
            <div className="mb-3 flex gap-1 rounded bg-ink p-1 text-sm">
              {(["calendar", "skills"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded px-2 py-1 capitalize ${tab === t ? "bg-line font-semibold" : "text-slate-400"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "calendar" ? (
              <Calendar solved={solved} byId={byId} />
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold">Difficulty</p>
                  {(["Easy", "Medium", "Hard"] as const).map((d) => (
                    <div key={d} className="mb-2">
                      <div className="flex justify-between text-xs">
                        <span className={DIFF[d]}>{d}</span>
                        <span className="text-slate-400">
                          {diffStats[d].done}/{diffStats[d].total}
                        </span>
                      </div>
                      <div className="h-1.5 rounded bg-line">
                        <div
                          className="h-1.5 rounded bg-glow"
                          style={{
                            width: pct(diffStats[d].done, diffStats[d].total),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold">Strongest topics</p>
                  {skills.length === 0 && (
                    <p className="text-sm text-slate-400">
                      Solve a few problems and your strongest topics will appear
                      here.
                    </p>
                  )}
                  {skills.map(([name, s]) => {
                    const [label, color] = level(s.done);
                    return (
                      <div key={name} className="mb-3">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate">{name}</span>
                          <span
                            className={`shrink-0 text-xs font-semibold ${color}`}
                          >
                            {label}
                          </span>
                        </div>
                        <div className="h-1.5 rounded bg-line">
                          <div
                            className="h-1.5 rounded bg-brand"
                            style={{ width: pct(s.done, s.total) }}
                          />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {s.done} of {s.total} solved
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
