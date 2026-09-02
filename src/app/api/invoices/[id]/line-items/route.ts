import { auth } from "@/lib/auth";
import { addLineItem, removeLineItem } from "@/lib/services/invoice-service";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();

  try {
    const item = await addLineItem(id, body);
    return Response.json({ data: item }, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return Response.json({ error: "itemId required" }, { status: 400 });

  try {
    await removeLineItem(itemId);
    return Response.json({ data: { deleted: true } });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
