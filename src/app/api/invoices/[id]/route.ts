import { auth } from "@/lib/auth";
import { getInvoice, updateInvoice } from "@/lib/services/invoice-service";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const invoice = await getInvoice(id);
  if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ data: invoice });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();

  try {
    const invoice = await updateInvoice(id, body);
    return Response.json({ data: invoice });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
