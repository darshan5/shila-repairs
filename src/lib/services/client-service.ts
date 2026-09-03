import { prisma } from "@/lib/prisma";

export async function getClients(filters?: { search?: string; page?: number; limit?: number }) {
  const where: any = {};
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { corporationName: { contains: filters.search, mode: "insensitive" } },
      { storeNumber: { contains: filters.search, mode: "insensitive" } },
      { city: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 10;

  const [data, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: { _count: { select: { workOrders: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getAllClients() {
  return prisma.client.findMany({
    where: { isActive: true },
    select: { id: true, name: true, corporationName: true, storeNumber: true },
    orderBy: { name: "asc" },
  });
}

export async function getClient(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      _count: { select: { workOrders: true } },
      workOrders: {
        select: { id: true, title: true, status: true, priority: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function createClient(data: {
  name: string;
  corporationName?: string;
  storeNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  billingName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingPhone?: string;
  billingEmail?: string;
  notes?: string;
}) {
  return prisma.client.create({ data });
}

export async function updateClient(id: string, data: any) {
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw new Error("Client not found");
  return prisma.client.update({ where: { id }, data });
}

export async function deactivateClient(id: string) {
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw new Error("Client not found");
  return prisma.client.update({ where: { id }, data: { isActive: !client.isActive } });
}

export async function getClientByStoreNumber(storeNumber: string) {
  return prisma.client.findUnique({ where: { storeNumber } });
}
