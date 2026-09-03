import { auth } from "@/lib/auth";
import { getClient, updateClient, deactivateClient } from "@/lib/services/client-service";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const client = await getClient(id);
  if (!client) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ data: client });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();

  try {
    const client = await updateClient(id, body);
    return Response.json({ data: client });
  } catch (e: any) {
    if (e.message === "Client not found") return Response.json({ error: e.message }, { status: 404 });
    if (e.message?.includes("Unique constraint")) return Response.json({ error: "Store number already exists" }, { status: 409 });
    throw e;
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  try {
    const client = await deactivateClient(id);
    return Response.json({ data: client });
  } catch (e: any) {
    if (e.message === "Client not found") return Response.json({ error: e.message }, { status: 404 });
    throw e;
  }
}
