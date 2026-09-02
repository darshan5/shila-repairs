import { prisma } from "@/lib/prisma";

export async function getTasks(filters?: { status?: string }) {
  const where: any = {};
  if (filters?.status && filters.status !== "all") where.status = filters.status;

  return prisma.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: string;
  assignedTo?: string;
  dueDate?: string;
}) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || "MEDIUM",
      assignedTo: data.assignedTo,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });
}

export async function updateTask(
  id: string,
  data: { title?: string; description?: string; priority?: string; assignedTo?: string; dueDate?: string | null }
) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found");

  return prisma.task.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
    },
  });
}

export async function completeTask(id: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found");

  return prisma.task.update({
    where: { id },
    data: {
      status: task.status === "completed" ? "open" : "completed",
      completedAt: task.status === "completed" ? null : new Date(),
    },
  });
}
