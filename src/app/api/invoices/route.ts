import { auth } from "@/lib/auth";
import { getInvoices, createInvoice } from "@/lib/services/invoice-service";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const data = await getInvoices({ status: searchParams.get("status") || undefined });
  return Response.json({ data });
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
