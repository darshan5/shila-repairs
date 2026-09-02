import { prisma } from "@/lib/prisma";

function generateInvoiceNumber(): string {
  const date = new Date();
  const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${rand}`;
}

export async function createInvoice(workOrderId: string) {
  const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!wo) throw new Error("Work order not found");

  const existing = await prisma.invoice.findUnique({ where: { workOrderId } });
  if (existing) throw new Error("Invoice already exists for this work order");

  const cost = wo.actualCost || wo.estimatedCost || 0;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      workOrderId,
      customerName: wo.locationName || "",
      customerAddress: wo.equipmentName ? `Equipment: ${wo.equipmentName}` : "",
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

export async function getInvoices(filters?: { status?: string }) {
  const where: any = {};
  if (filters?.status && filters.status !== "all") where.status = filters.status;

  return prisma.invoice.findMany({
    where,
    include: {
      workOrder: { select: { title: true, locationName: true } },
      _count: { select: { lineItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });
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
  if (invoice.status === "finalized") throw new Error("Cannot edit finalized invoice");

  const total = data.quantity * data.unitPrice;
  const item = await prisma.invoiceLineItem.create({
    data: { invoiceId, ...data, total },
  });

  await recalculateTotals(invoiceId);
  return item;
}

export async function removeLineItem(id: string) {
  const item = await prisma.invoiceLineItem.findUnique({
    where: { id },
    include: { invoice: { select: { status: true } } },
  });
  if (!item) throw new Error("Line item not found");
  if (item.invoice.status === "finalized") throw new Error("Cannot edit finalized invoice");

  await prisma.invoiceLineItem.delete({ where: { id } });
  await recalculateTotals(item.invoiceId);
}

export async function updateInvoice(
  id: string,
  data: { vendorName?: string; vendorAddress?: string; customerName?: string; customerAddress?: string; notes?: string; tax?: number }
) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "finalized") throw new Error("Cannot edit finalized invoice");

  const updated = await prisma.invoice.update({ where: { id }, data });
  if (data.tax != null) await recalculateTotals(id);
  return updated;
}

export async function finalizeInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "finalized") throw new Error("Already finalized");

  return prisma.invoice.update({ where: { id }, data: { status: "finalized" } });
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
