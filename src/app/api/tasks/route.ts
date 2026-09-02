import { auth } from "@/lib/auth";
import { getTasks, createTask } from "@/lib/services/task-service";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const data = await getTasks({ status: searchParams.get("status") || undefined });
  return Response.json({ data });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title) return Response.json({ error: "Title required" }, { status: 400 });

  const task = await createTask(body);
  return Response.json({ data: task }, { status: 201 });
}
