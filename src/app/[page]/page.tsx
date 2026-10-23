import { notFound } from "next/navigation";
import Link from "next/link";

const PAGES: Record<string, { title: string; body: string[] }> = {
  terms: { title: "Terms", body: [
    "DSA Path is a free tool for organising data structures and algorithms practice.",
    "Problems belong to LeetCode. DSA Path links to them and is not affiliated with LeetCode.",
    "Do not misuse the site or try to disrupt it. We may remove accounts that do.",
    "The site is provided as is, without a guarantee of uptime."] },
  privacy: { title: "Privacy", body: [
    "We store your sign-in details (through Clerk) and the problems you mark as solved.",
    "We use this only to run your account and show your progress.",
    "We do not sell your data. To delete your data, email vivekchh123@gmail.com."] },
  security: { title: "Security", body: [
    "Passwords are handled by Clerk and never reach our servers.",
    "All traffic uses HTTPS once deployed.",
    "Found a vulnerability? Email vivekchh123@gmail.com with the details."] },
  status: { title: "Status", body: ["All systems operational."] },
  docs: { title: "Docs", body: [
    "Pick a topic on the left, then tick a problem when you solve it.",
    "Click a title to open it on LeetCode. Click the play icon to watch a solution.",
    "Search by question number or name. Your calendar highlights each day you solved problems."] },
  contact: { title: "Contact", body: [] },
};

export function generateStaticParams() { return Object.keys(PAGES).map((page) => ({ page })); }

export default async function Page({ params }: { params:Promise< { page: string } > }) {
  const { page } = await params;
  const p = PAGES[page];
  if (!p) notFound();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-slate-400 hover:text-white">
        Back to DSA Path
      </Link>
      <h1 className="mb-4 mt-3 text-2xl font-bold">{p.title}</h1>
      <div className="space-y-3 text-slate-300">
        {p.body.map((t, i) => (
          <p key={i}>{t}</p>
        ))}
        {page === "contact" && (
          <ul className="space-y-2">
            <li>
              <a
                className="text-glow"
                href="https://www.linkedin.com/in/vivek-chaurasiya-4417053a3"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                className="text-glow"
                href="https://www.instagram.com/vivek_chaurasiya29/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </li>
            <li>
              <a className="text-glow" href="mailto:vivekchh123@gmail.com">
                vivekchh123@gmail.com
              </a>
            </li>
          </ul>
        )}
      </div>
    </main>
  );
}
