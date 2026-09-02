import { auth } from "@/lib/auth";
import { getWorkOrder } from "@/lib/services/work-order-service";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const wo = await getWorkOrder(id);
  if (!wo) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ data: wo });
}
