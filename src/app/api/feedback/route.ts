import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/supabase";

// Anyone can read: summary bars, the latest comments, and (if signed in) their own entry
export async function GET() {
  const { userId } = await auth();
  const [sum, list, mine] = await Promise.all([
    db.rpc("feedback_summary"),
    db
      .from("feedback")
      .select("name, rating, comment, created_at")
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(100),
    userId
      ? db
          .from("feedback")
          .select("name, rating, comment, created_at")
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (sum.error || list.error)
    return Response.json({ error: "Could not load feedback" }, { status: 500 });

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of sum.data ?? []) counts[r.rating] = Number(r.n);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const sumRatings = Object.entries(counts).reduce(
    (s, [k, v]) => s + Number(k) * v,
    0,
  );
  const average = total ? Math.round((sumRatings / total) * 10) / 10 : 0;

  return Response.json(
    { total, average, counts, items: list.data ?? [], mine: mine.data ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// Only registered (signed-in) users can submit
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return Response.json(
      { error: "Please sign up or sign in to leave feedback." },
      { status: 401 },
    );

  const body = await req.json().catch(() => null);
  const rating = body?.rating;
  const name =
    typeof body?.name === "string" ? body.name.trim().slice(0, 40) : "";
  const comment =
    typeof body?.comment === "string" ? body.comment.trim().slice(0, 280) : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return Response.json(
      { error: "Pick a rating from 1 to 5." },
      { status: 400 },
    );
  if (!name)
    return Response.json({ error: "Please enter your name." }, { status: 400 });

  const { error } = await db
    .from("feedback")
    .upsert(
      {
        user_id: userId,
        name,
        rating,
        comment: comment || null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (error)
    return Response.json(
      { error: "Could not save your feedback." },
      { status: 500 },
    );
  return Response.json({ ok: true });
}
