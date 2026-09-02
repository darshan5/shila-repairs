import { auth } from "@/lib/auth";
import { syncWorkOrders } from "@/lib/services/sync-service";

export async function POST() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await syncWorkOrders();
    return Response.json({ data: result });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
