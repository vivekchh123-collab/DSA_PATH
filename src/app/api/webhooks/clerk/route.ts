import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const SITE = "https://dsapath-vivek.vercel.app";
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function POST(req: NextRequest) {
  const evt = await verifyWebhook(req).catch(() => null);
  if (!evt) return new Response("Invalid webhook signature", { status: 400 });
  if (evt.type !== "user.created")
    return new Response("Ignored", { status: 200 });

  const u = evt.data;
  const to =
    u.email_addresses.find((e) => e.id === u.primary_email_address_id)
      ?.email_address ?? u.email_addresses[0]?.email_address;
  if (!to) return new Response("No email address", { status: 200 });
  const name = (u.first_name ?? "").replace(/[\r\n]/g, " ").trim() || "there";

  const text = `Hello ${name},

Welcome to DSA Path!

WHAT IS DSA PATH?
DSA Path puts all 4,000+ LeetCode problems in one place, sorted by topic (Arrays, Hashing, Graphs, Dynamic Programming and more) and by Easy, Medium and Hard, so you always know what to solve next. Every problem opens directly on LeetCode, so you still solve on the real platform.

HOW TO GET STARTED
1. Pick a topic (on a phone, tap "Topics") and filter by Easy, Medium or Hard.
2. Open a problem, solve it on LeetCode, then come back and tick it. Because you are signed in, your progress is saved to your account.
3. Open the calendar to see what you solved each day. Click an earlier date and your ticks count on that date. The Skills tab shows your strongest topics.
4. Stuck? Tap the play icon next to a problem to find video solutions.

HOW IT KEEPS YOU PRODUCTIVE
- No more wasting time deciding what to solve next.
- Work through a topic from Easy to Medium to Hard, in order.
- Your daily calendar shows how consistent you are.
- Your strongest topics show where to practise more.

ONE LAST THING
I am building DSA Path with learners like you. Please click "Feedback" in the footer of the website, rate your experience from 1 to 5 and tell me what to improve.

Start here: ${SITE}

Happy solving,
Er. Vivek Chaurasiya
Creator of DSA Path
`;

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1c2033;line-height:1.55">
<h2 style="margin:0 0 8px">Hello ${esc(name)}, welcome to DSA Path! 🎉</h2>
<p><strong>What is DSA Path?</strong><br>All 4,000+ LeetCode problems in one place, sorted by topic (Arrays, Hashing, Graphs, Dynamic Programming and more) and by Easy, Medium and Hard, so you always know what to solve next. Every problem opens directly on LeetCode, so you still solve on the real platform.</p>
<p><strong>How to get started</strong></p>
<ol>
<li>Pick a topic (on a phone, tap <em>Topics</em>) and filter by Easy, Medium or Hard.</li>
<li>Open a problem, solve it on LeetCode, then come back and tick it. Your progress is saved to your account.</li>
<li>Open the calendar to see what you solved each day. Click an earlier date and your ticks count on that date. The <em>Skills</em> tab shows your strongest topics.</li>
<li>Stuck? Tap the ▶ next to a problem to find video solutions.</li>
</ol>
<p><strong>How it keeps you productive</strong></p>
<ul>
<li>No more wasting time deciding what to solve next.</li>
<li>Work through a topic from Easy to Medium to Hard, in order.</li>
<li>Your daily calendar shows how consistent you are.</li>
<li>Your strongest topics show where to practise more.</li>
</ul>
<p><strong>One last thing:</strong> I am building DSA Path with learners like you. Click <em>Feedback</em> in the footer, rate your experience from 1 to 5 and tell me what to improve.</p>
<p><a href="${SITE}" style="display:inline-block;background:#7c6cf6;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Open DSA Path</a></p>
<p>Happy solving,<br>Er. Vivek Chaurasiya<br><span style="color:#667">Creator of DSA Path</span></p>
</div>`;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: `"DSA Path" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Welcome to DSA Path, ${name}!`,
      text,
      html,
    });
  } catch (e) {
    console.error("welcome email failed:", e);
    return new Response("Email failed", { status: 500 }); // Clerk will retry
  }
  return new Response("Welcome email sent", { status: 200 });
}
