import { prisma } from "@/lib/prisma";
import { pushStatusToWalkTheFloor } from "./sync-service";

export async function getWorkOrders(filters: {
  status?: string;
  priority?: string;
}) {
  const where: any = {};
  if (filters.status && filters.status !== "all") where.status = filters.status;
  if (filters.priority && filters.priority !== "all") where.priority = filters.priority;

  return prisma.workOrder.findMany({
    where,
    include: {
      _count: { select: { comments: true } },
      invoice: { select: { id: true, invoiceNumber: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getWorkOrder(id: string) {
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      invoice: { select: { id: true, invoiceNumber: true, status: true } },
    },
  });
  if (!wo) return null;

  const userIds = wo.comments.map(c => c.userId).filter(Boolean) as string[];
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: [...new Set(userIds)] } }, select: { id: true, name: true } })
    : [];
  const userMap = new Map(users.map(u => [u.id, u.name]));

  return {
    ...wo,
    comments: wo.comments.map(c => ({
      ...c,
      userName: c.userId ? userMap.get(c.userId) || null : null,
    })),
  };
}

export async function createWorkOrder(data: {
  title: string;
  description?: string;
  priority?: string;
  locationName?: string;
  equipmentName?: string;
  assignedTo?: string;
  estimatedCost?: number;
  notes?: string;
  clientId?: string;
}) {
  return prisma.workOrder.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || "MEDIUM",
      source: "local",
      locationName: data.locationName,
      equipmentName: data.equipmentName,
      assignedTo: data.assignedTo,
      estimatedCost: data.estimatedCost,
      notes: data.notes,
      clientId: data.clientId || null,
    },
  });
}

export async function updateStatus(
  id: string,
  status: string,
  data?: { deferredDate?: string; deferredReason?: string; actualCost?: number; notes?: string }
) {
  const wo = await prisma.workOrder.findUnique({ where: { id } });
  if (!wo) throw new Error("Work order not found");

  const updateData: any = { status };

  if (status === "deferred" && data?.deferredDate) {
    updateData.deferredDate = new Date(data.deferredDate);
    updateData.deferredReason = data.deferredReason || null;
  }

  if (status === "completed") {
    updateData.completedAt = new Date();
    if (data?.actualCost != null) updateData.actualCost = data.actualCost;
  }

  const updated = await prisma.workOrder.update({ where: { id }, data: updateData });

  if (data?.notes) {
    await prisma.workOrderComment.create({
      data: { workOrderId: id, content: data.notes, userId: null },
    });
  }

  if (wo.externalId) {
    pushStatusToWalkTheFloor(id).catch(() => {});
  }

  return updated;
}

export async function addComment(workOrderId: string, userId: string | null, content: string) {
  const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!wo) throw new Error("Work order not found");

  return prisma.workOrderComment.create({
    data: { workOrderId, userId, content },
  });
}

export async function getStats(dateFrom?: Date, dateTo?: Date) {
  const dateFilter: any = {};
  if (dateFrom) dateFilter.gte = dateFrom;
  if (dateTo) dateFilter.lt = dateTo;
  const createdFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

  const [pending, approved, inProgress, deferred, completed, invoiced] = await Promise.all([
    prisma.workOrder.count({ where: { status: "pending", ...createdFilter } }),
    prisma.workOrder.count({ where: { status: "approved", ...createdFilter } }),
    prisma.workOrder.count({ where: { status: "in_progress", ...createdFilter } }),
    prisma.workOrder.count({ where: { status: "deferred", ...createdFilter } }),
    prisma.workOrder.count({ where: { status: "completed", ...createdFilter } }),
    prisma.workOrder.count({ where: { status: "invoiced", ...createdFilter } }),
  ]);

  return { pending, approved, inProgress, deferred, completed, invoiced };
}
