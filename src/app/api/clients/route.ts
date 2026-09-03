import { auth } from "@/lib/auth";
import { getClients, getAllClients, createClient } from "@/lib/services/client-service";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  if (searchParams.get("all") === "true") {
    const data = await getAllClients();
    return Response.json({ data });
  }

  const data = await getClients({
    search: searchParams.get("search") || undefined,
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  return Response.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name?.trim()) return Response.json({ error: "Name required" }, { status: 400 });

  try {
    const client = await createClient(body);
    return Response.json({ data: client }, { status: 201 });
  } catch (e: any) {
    if (e.message?.includes("Unique constraint")) return Response.json({ error: "Store number already exists" }, { status: 409 });
    throw e;
  }
}
