import { auth } from "@/lib/auth";
import { getWorkOrders, createWorkOrder } from "@/lib/services/work-order-service";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const data = await getWorkOrders({
    status: searchParams.get("status") || undefined,
    priority: searchParams.get("priority") || undefined,
  });
  return Response.json({ data });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title) return Response.json({ error: "Title required" }, { status: 400 });

  const wo = await createWorkOrder(body);
  return Response.json({ data: wo }, { status: 201 });
}
