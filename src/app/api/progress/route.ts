import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/supabase";

// GET: returns this user's solved problems as { "1": "2026-10-23", ... }
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ solved: {} });

  const { data, error } = await db
    .from("progress")
    .select("problem_id, solved_on")
    .eq("user_id", userId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const solved: Record<number, string> = {};
  for (const r of data) solved[r.problem_id] = r.solved_on;
  return Response.json({ solved });
}

// POST: { problemId, solved: true|false, solvedOn: "YYYY-MM-DD" } adds or removes the row
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return Response.json({ error: "Sign in first" }, { status: 401 });

  const { problemId, solved, solvedOn } = await req.json();
  if (!Number.isInteger(problemId) || typeof solved !== "boolean") {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  if (solved) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(solvedOn))
      return Response.json({ error: "bad date" }, { status: 400 });
    const { error } = await db
      .from("progress")
      .upsert(
        { user_id: userId, problem_id: problemId, solved_on: solvedOn },
        { onConflict: "user_id,problem_id" },
      );
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await db
      .from("progress")
      .delete()
      .eq("user_id", userId)
      .eq("problem_id", problemId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
