import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/supabase";

export async function POST(req: Request) {
  const { id } = await req.json();
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "bad id" }, { status: 400 });
  }

  let visitors: number | null = null;
  let online: number | null = null;
  let registered: number | null = null;

  try {
    const up = await db
      .from("visitors")
      .upsert({ visitor_id: id, last_seen: new Date().toISOString() });
    if (up.error) throw up.error;
    const { data, error } = await db.rpc("site_stats");
    if (error) throw error;
    visitors = Number(data?.[0]?.visitors ?? 0);
    online = Number(data?.[0]?.online ?? 0);
  } catch (e) {
    console.error("ping/supabase:", e);
  }

  try {
    const clerk = await clerkClient();
    registered = await clerk.users.getCount();
  } catch (e) {
    console.error("ping/clerk:", e);
  }

  return Response.json({ visitors, online, registered });
}
