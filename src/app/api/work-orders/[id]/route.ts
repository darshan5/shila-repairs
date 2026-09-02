import { auth } from "@/lib/auth";
import { getWorkOrder } from "@/lib/services/work-order-service";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const wo = await getWorkOrder(id);
  if (!wo) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ data: wo });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();

  const wo = await prisma.workOrder.findUnique({ where: { id } });
  if (!wo) return Response.json({ error: "Not found" }, { status: 404 });
  if (["completed", "invoiced"].includes(wo.status)) {
    return Response.json({ error: "Cannot edit a closed work order" }, { status: 409 });
  }

  const data: any = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.locationName !== undefined) data.locationName = body.locationName;
  if (body.equipmentName !== undefined) data.equipmentName = body.equipmentName;
  if (body.estimatedCost !== undefined) data.estimatedCost = body.estimatedCost;
  if (body.notes !== undefined) data.notes = body.notes;

  const updated = await prisma.workOrder.update({ where: { id }, data });
  return Response.json({ data: updated });
}
