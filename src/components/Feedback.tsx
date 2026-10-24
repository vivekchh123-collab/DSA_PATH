"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SignInButton, SignUpButton, useAuth, useUser } from "@clerk/nextjs";

export const RATINGS = [
  { v: 1, e: "😠", label: "Very dissatisfied" },
  { v: 2, e: "🙁", label: "Dissatisfied" },
  { v: 3, e: "😐", label: "Neutral" },
  { v: 4, e: "🙂", label: "Satisfied" },
  { v: 5, e: "😍", label: "Very satisfied" },
];
export const EMOJI = RATINGS.map((r) => r.e);

export type FeedbackItem = {
  name: string;
  rating: number;
  comment: string | null;
  created_at?: string;
};
export type FeedbackData = {
  total: number;
  average: number;
  counts: Record<number, number>;
  items: FeedbackItem[];
  mine: FeedbackItem | null;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function useFeedback() {
  const { isSignedIn } = useAuth();
  const [data, setData] = useState<FeedbackData | null>(null);
  const reload = useCallback(() => {
    fetch("/api/feedback", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    reload();
  }, [reload, isSignedIn]);
  return { data, reload };
}

// Cycles 0..n-1 every `ms` milliseconds (used by the footer line)
export function useRotate(n: number, ms = 4000) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), ms);
    return () => clearInterval(t);
  }, [n, ms]);
  return n ? i % n : 0;
}

export function FeedbackModal({
  open,
  onClose,
  data,
  reload,
}: {
  open: boolean;
  onClose: () => void;
  data: FeedbackData | null;
  reload: () => void;
}) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [sort, setSort] = useState<"top" | "new">("top");
  const [showForm, setShowForm] = useState(false);

  const total = data?.total ?? 0;
  const avg = data?.average ?? 0;

  // "top": 5-rating people first, 1-rating last. The server sends newest first,
  // and the sort keeps that order inside each rating, so each group is new to old.
  const sorted = useMemo(() => {
    const list = data?.items ?? [];
    return sort === "top"
      ? [...list].sort((a, b) => b.rating - a.rating)
      : list;
  }, [data?.items, sort]);

  // every time the window opens, start with the form closed
  useEffect(() => {
    if (open) {
      setStatus("idle");
      setError("");
      setShowForm(false);
    }
  }, [open]);

  // prefill from the user's earlier feedback, or from their sign-up name
  useEffect(() => {
    if (data?.mine) {
      setRating(data.mine.rating);
      setName(data.mine.name);
      setComment(data.mine.comment ?? "");
    } else {
      setName((n) => n || user?.firstName || "");
    }
  }, [data?.mine, user?.firstName]);

  // Escape closes the window, and the page behind does not scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async () => {
    if (!rating) {
      setError("Please pick a rating.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, name, comment }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not save your feedback.");
      setStatus("done");
      reload();
    } catch (e) {
      setStatus("idle");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fb-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg space-y-5 overflow-y-auto rounded-t-2xl border border-line bg-ink p-5 sm:rounded-2xl"
      >
        {/* title */}
        <div>
          <div className="flex items-center justify-between">
            <h2 id="fb-title" className="text-xl font-bold">
              Feedback
            </h2>
            <button
              onClick={onClose}
              aria-label="Close feedback"
              className="rounded border border-line px-2 py-1 text-sm hover:bg-panel"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Hi, I’m Vivek, the creator of DSA Path. Your honest feedback decides
            what I build next. 🙏
          </p>
        </div>

        {/* average and 5-to-1 bars */}
        <div className="flex items-center gap-4">
          <div className="shrink-0 text-center">
            <div className="text-4xl">
              {total ? EMOJI[Math.round(avg) - 1] : "💬"}
            </div>
            <div className="text-2xl font-bold">
              {total ? avg.toFixed(1) : "–"}
            </div>
            <div className="text-xs text-slate-400">
              {total} {total === 1 ? "rating" : "ratings"}
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((v) => {
              const n = data?.counts?.[v] ?? 0;
              return (
                <div key={v} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-right text-slate-400">{v}</span>
                  <span aria-hidden>{EMOJI[v - 1]}</span>
                  <div className="h-2 flex-1 rounded bg-line">
                    <div
                      className="bar-grow h-2 rounded bg-glow"
                      style={{ width: `${total ? (n / total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-slate-400">{n}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* GIVE FEEDBACK button, just below the rating summary */}
        <button
          onClick={() => setShowForm((s) => !s)}
          aria-expanded={showForm}
          className="w-full rounded bg-brand px-4 py-2 font-semibold text-white hover:opacity-90"
        >
          {showForm ? "Close" : "Give Feedback"}
        </button>

        {/* THE FORM CARD: opens when the button is clicked */}
        {showForm &&
          (isLoaded && isSignedIn ? (
            <div className="space-y-3 rounded-xl border border-line bg-panel p-4">
              <p className="text-sm font-semibold">
                {data?.mine
                  ? "Update your feedback"
                  : "How was your experience?"}
              </p>
              <div
                role="radiogroup"
                aria-label="Your rating"
                className="grid grid-cols-5 gap-1"
              >
                {RATINGS.map((r) => (
                  <button
                    key={r.v}
                    type="button"
                    role="radio"
                    aria-checked={rating === r.v}
                    onClick={() => setRating(r.v)}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition ${rating === r.v ? "scale-105 border-glow bg-glow/15" : "border-line hover:bg-ink"}`}
                  >
                    <span className="text-2xl sm:text-3xl">{r.e}</span>
                    <span className="text-[10px] leading-tight text-slate-400">
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
              <div>
                <label
                  htmlFor="fb-name"
                  className="mb-1 block text-sm text-slate-300"
                >
                  Your name
                </label>
                <input
                  id="fb-name"
                  value={name}
                  maxLength={40}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border border-line bg-ink px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="fb-comment"
                  className="mb-1 block text-sm text-slate-300"
                >
                  Do you have any thoughts you’d like to share?
                </label>
                <textarea
                  id="fb-comment"
                  rows={3}
                  maxLength={280}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What do you like? What should I improve? Which topic or feature do you want next?"
                  className="w-full rounded border border-line bg-ink px-3 py-2 text-sm"
                />
                <p className="text-right text-xs text-slate-500">
                  {comment.length}/280
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Your name, rating and comment are shown publicly on the site.
              </p>
              {error && (
                <p role="alert" className="text-sm text-rose-400">
                  {error}
                </p>
              )}
              {status === "done" && (
                <p role="status" className="text-sm text-emerald-400">
                  Thank you, {name.trim()}! 🙏 Your feedback is live, and I read
                  every one.
                </p>
              )}
              <button
                onClick={submit}
                disabled={status === "sending"}
                className="w-full rounded bg-brand px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {status === "sending"
                  ? "Sending…"
                  : data?.mine
                    ? "Update feedback"
                    : "Submit feedback"}
              </button>
            </div>
          ) : isLoaded ? (
            <div className="rounded-xl border border-line bg-panel p-4 text-sm">
              <p className="mb-3">
                Feedback is open to registered users. Sign up (it takes a few
                seconds) to rate DSA Path.
              </p>
              <div className="flex gap-2">
                <SignUpButton mode="modal">
                  <button className="rounded bg-brand px-3 py-2 font-semibold text-white hover:opacity-90">
                    Sign up
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="rounded border border-line px-3 py-2 hover:bg-ink">
                    Sign in
                  </button>
                </SignInButton>
              </div>
            </div>
          ) : null)}

        {/* THE LIST: no animation, 5 at the top, 1 at the bottom, newest first */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">What people say</h3>
            <div
              role="group"
              aria-label="Sort feedback"
              className="flex gap-1 rounded bg-panel p-1 text-xs"
            >
              {(
                [
                  ["top", "Top rated"],
                  ["new", "Newest"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setSort(k)}
                  className={`rounded px-2 py-1 ${sort === k ? "bg-line font-semibold" : "text-slate-400"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ul className="space-y-2 sm:max-h-72 sm:overflow-y-auto sm:pr-1">
            {sorted.length === 0 && (
              <li className="rounded-lg border border-line bg-panel p-3 text-sm text-slate-400">
                No feedback yet. Be the first to share your thoughts!
              </li>
            )}
            {sorted.map((it, i) => (
              <li
                key={i}
                className="rounded-lg border border-line bg-panel p-3"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-2xl">{EMOJI[it.rating - 1]}</span>
                  <strong className="min-w-0 truncate">{it.name}</strong>
                  <span className="shrink-0 text-slate-400">{it.rating}/5</span>
                  {it.created_at && (
                    <span className="ml-auto shrink-0 text-xs text-slate-500">
                      {formatDate(it.created_at)}
                    </span>
                  )}
                </div>
                {it.comment && (
                  <p className="mt-1 text-sm text-slate-300">“{it.comment}”</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
