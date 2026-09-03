import { prisma } from "@/lib/prisma";

function generateInvoiceNumber(): string {
  const date = new Date();
  const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${rand}`;
}

export async function createInvoice(workOrderId: string) {
  const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId }, include: { client: true } });
  if (!wo) throw new Error("Work order not found");

  const existing = await prisma.invoice.findUnique({ where: { workOrderId } });
  if (existing) throw new Error("Invoice already exists for this work order");

  const cost = wo.actualCost || wo.estimatedCost || 0;

  let customerName = wo.locationName || "";
  let customerAddress = wo.equipmentName ? `Equipment: ${wo.equipmentName}` : "";

  if (wo.client) {
    customerName = wo.client.billingName || wo.client.corporationName || wo.client.name;
    const parts = [wo.client.billingAddress, wo.client.billingCity, wo.client.billingState && wo.client.billingZip ? `${wo.client.billingState} ${wo.client.billingZip}` : wo.client.billingState || wo.client.billingZip].filter(Boolean);
    if (parts.length) customerAddress = parts.join(", ");
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      workOrderId,
      customerName,
      customerAddress,
      subtotal: cost,
      total: cost,
      notes: wo.notes || wo.description || "",
      lineItems: {
        create: [
          {
            description: wo.title,
            quantity: 1,
            unitPrice: cost,
            total: cost,
            category: "labor",
          },
        ],
      },
    },
    include: { lineItems: true, workOrder: { select: { title: true, locationName: true } } },
  });

  await prisma.workOrder.update({ where: { id: workOrderId }, data: { status: "invoiced" } });

  return invoice;
}

export async function getInvoices(filters?: { status?: string; search?: string; sortBy?: string; page?: number; limit?: number; dateFrom?: string; dateTo?: string }) {
  const where: any = {};
  if (filters?.status === "active") {
    where.status = { not: "void" };
  } else if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo + "T23:59:59Z");
  }
  if (filters?.search) {
    where.OR = [
      { invoiceNumber: { contains: filters.search, mode: "insensitive" } },
      { customerName: { contains: filters.search, mode: "insensitive" } },
      { workOrder: { title: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 10;

  let orderBy: any = { createdAt: "desc" };
  if (filters?.sortBy === "total") orderBy = { total: "desc" };
  else if (filters?.sortBy === "status") orderBy = { status: "asc" };
  else if (filters?.sortBy === "oldest") orderBy = { createdAt: "asc" };

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        workOrder: { select: { title: true, locationName: true } },
        _count: { select: { lineItems: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      lineItems: { orderBy: { category: "asc" } },
      workOrder: { select: { title: true, locationName: true, equipmentName: true, description: true } },
    },
  });
}

export async function addLineItem(
  invoiceId: string,
  data: { description: string; quantity: number; unitPrice: number; category: string }
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "void") throw new Error("Cannot edit voided invoice");

  const total = data.quantity * data.unitPrice;
  const item = await prisma.invoiceLineItem.create({
    data: { invoiceId, ...data, total },
  });

  if (invoice.status === "finalized") {
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "draft" } });
  }
  await recalculateTotals(invoiceId);
  return item;
}

export async function removeLineItem(id: string) {
  const item = await prisma.invoiceLineItem.findUnique({
    where: { id },
    include: { invoice: { select: { status: true } } },
  });
  if (!item) throw new Error("Line item not found");
  if (item.invoice.status === "void") throw new Error("Cannot edit voided invoice");

  await prisma.invoiceLineItem.delete({ where: { id } });
  if (item.invoice.status === "finalized") {
    await prisma.invoice.update({ where: { id: item.invoiceId }, data: { status: "draft" } });
  }
  await recalculateTotals(item.invoiceId);
}

export async function updateInvoice(
  id: string,
  data: { vendorName?: string; vendorAddress?: string; customerName?: string; customerAddress?: string; notes?: string; tax?: number; status?: string }
) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "void" && data.status !== "void") throw new Error("Cannot edit voided invoice");

  if (invoice.status === "finalized" && !data.status) {
    (data as any).status = "draft";
  }
  const updated = await prisma.invoice.update({ where: { id }, data });
  if (data.tax != null) await recalculateTotals(id);
  return updated;
}

export async function finalizeInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Invoice not found");

  return prisma.invoice.update({ where: { id }, data: { status: "finalized", finalizedAt: new Date() } });
}

export async function voidInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Invoice not found");

  return prisma.invoice.update({ where: { id }, data: { status: "void" } });
}

export async function getInvoiceStats(dateFrom?: Date, dateTo?: Date) {
  const where: any = { status: { not: "void" } };
  if (dateFrom) where.createdAt = { gte: dateFrom };
  if (dateTo) {
    where.createdAt = { ...where.createdAt, lt: dateTo };
  }

  const result = await prisma.invoice.aggregate({
    where,
    _sum: { total: true },
    _count: true,
  });

  return { totalAmount: result._sum.total || 0, count: result._count };
}

async function recalculateTotals(invoiceId: string) {
  const items = await prisma.invoiceLineItem.findMany({ where: { invoiceId } });
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  const tax = invoice?.tax || 0;
  const total = subtotal + tax;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotal: Math.round(subtotal * 100) / 100, total: Math.round(total * 100) / 100 },
  });
}
