"use client";
import { useCallback, useEffect, useState } from "react";
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
};
export type FeedbackData = {
  total: number;
  average: number;
  counts: Record<number, number>;
  items: FeedbackItem[];
  mine: FeedbackItem | null;
};

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

// Cycles 0..n-1 every `ms` milliseconds
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

  const items = data?.items ?? [];
  const idx = useRotate(items.length, 5000);
  const cur = items[idx];
  const total = data?.total ?? 0;
  const avg = data?.average ?? 0;

  useEffect(() => {
    if (open) {
      setStatus("idle");
      setError("");
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
        className="fade-up max-h-[92dvh] w-full max-w-lg space-y-5 overflow-y-auto rounded-t-2xl border border-line bg-ink p-5 sm:rounded-2xl"
      >
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

        {/* comments change one by one */}
        <div className="min-h-[92px] rounded-lg border border-line bg-panel p-3">
          {cur ? (
            <div key={idx} className="fade-up">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-2xl">{EMOJI[cur.rating - 1]}</span>
                <strong>{cur.name}</strong>
                <span className="text-slate-400">{cur.rating}/5</span>
                <span className="ml-auto text-xs text-slate-500">
                  {idx + 1} of {items.length}
                </span>
              </div>
              {cur.comment && (
                <p className="mt-1 text-sm text-slate-300">“{cur.comment}”</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No feedback yet. Be the first to share your thoughts!
            </p>
          )}
        </div>

        {isLoaded && isSignedIn ? (
          <div className="space-y-3 border-t border-line pt-4">
            <p className="text-sm font-semibold">
              {data?.mine ? "Update your feedback" : "How was your experience?"}
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
                  className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition ${rating === r.v ? "scale-105 border-glow bg-glow/15" : "border-line hover:bg-panel"}`}
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
                className="w-full rounded border border-line bg-panel px-3 py-2 text-sm"
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
                className="w-full rounded border border-line bg-panel px-3 py-2 text-sm"
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
                Thank you! Your feedback is now live.
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
          <div className="rounded-lg border border-line bg-panel p-4 text-sm">
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
        ) : null}
      </div>
    </div>
  );
}
