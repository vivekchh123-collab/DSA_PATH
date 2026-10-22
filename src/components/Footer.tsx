import Link from "next/link";

const LINKS = [
  ["Terms", "/terms"], ["Privacy", "/privacy"], ["Security", "/security"],
  ["Status", "/status"], ["Docs", "/docs"], ["Contact", "/contact"],
];

export default function Footer() {
  return (
    <footer className="z-30 shrink-0 border-t border-line bg-ink">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-square.png" alt="DSA Path logo" className="h-9 w-9 rounded-lg" />
          <span className="text-sm font-semibold">© 2026 DSA Path, Inc.</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-400">
          {LINKS.map(([name, href]) => (
            <Link key={href} href={href} className="hover:text-white">{name}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
