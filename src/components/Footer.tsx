"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import {
  EMOJI,
  FeedbackModal,
  useFeedback,
  useRotate,
} from "@/components/Feedback";

const LINKS = [
  ["Terms", "/terms"],
  ["Privacy", "/privacy"],
  ["Security", "/security"],
  ["Status", "/status"],
  ["Docs", "/docs"],
  ["Contact", "/contact"],
];

export default function Footer() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { data, reload } = useFeedback();
  const items = data?.items ?? [];
  const idx = useRotate(items.length);
  const cur = items[idx];

  return (
    <>
      <footer className="sticky bottom-0 z-30 shrink-0 border-t border-line bg-ink">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-1.5 px-4 py-2 md:flex-row md:items-center md:gap-6">
          <div className="flex shrink-0 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-square.png"
              alt="DSA Path logo"
              className="h-8 w-8 rounded-lg"
            />
            <span className="text-sm font-semibold">© 2026 DSA Path, Inc.</span>
          </div>

          {/* rotating names and ratings, visible to everyone */}
          <button
            onClick={() => setOpen(true)}
            className="min-w-0 flex-1 text-left"
            aria-label="Open feedback"
          >
            {cur ? (
              <p key={idx} className="fade-up truncate text-xs text-slate-300">
                <span aria-hidden>{EMOJI[cur.rating - 1]}</span>{" "}
                <strong>{cur.name}</strong> rated {cur.rating}/5
                {cur.comment ? (
                  <span className="text-slate-400"> · “{cur.comment}”</span>
                ) : null}
              </p>
            ) : (
              <p className="truncate text-xs text-slate-500">
                Share your feedback
              </p>
            )}
          </button>

          <nav
            aria-label="Footer"
            className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400 sm:gap-x-4 sm:text-sm"
          >
            {LINKS.map(([name, href]) => (
              <Link key={href} href={href} className="hover:text-white">
                {name}
              </Link>
            ))}
            <button
              onClick={() => setOpen(true)}
              className="font-medium text-glow hover:text-white"
            >
              Feedback
            </button>
          </nav>
        </div>
      </footer>
      <FeedbackModal open={open} onClose={close} data={data} reload={reload} />
    </>
  );
}
