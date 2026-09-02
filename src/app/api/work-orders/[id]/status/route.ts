import { auth } from "@/lib/auth";
import { updateStatus } from "@/lib/services/work-order-service";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();

  try {
    const wo = await updateStatus(id, body.status, body);
    return Response.json({ data: wo });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
