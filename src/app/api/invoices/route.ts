import { auth } from "@/lib/auth";
import { getInvoices, createInvoice } from "@/lib/services/invoice-service";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const result = await getInvoices({
    status: searchParams.get("status") || "active",
    search: searchParams.get("search") || undefined,
    sortBy: searchParams.get("sortBy") || undefined,
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
  });
  return Response.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { workOrderId } = await req.json();
  if (!workOrderId) return Response.json({ error: "workOrderId required" }, { status: 400 });

  try {
    const invoice = await createInvoice(workOrderId);
    return Response.json({ data: invoice }, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
