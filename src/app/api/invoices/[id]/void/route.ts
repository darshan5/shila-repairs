import { auth } from "@/lib/auth";
import { voidInvoice } from "@/lib/services/invoice-service";

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  try {
    const inv = await voidInvoice(id);
    return Response.json({ data: inv });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
