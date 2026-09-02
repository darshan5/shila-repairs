import { auth } from "@/lib/auth";
import { addComment } from "@/lib/services/work-order-service";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const { content } = await req.json();
  if (!content?.trim()) return Response.json({ error: "Content required" }, { status: 400 });

  const comment = await addComment(id, (session.user as any).id, content);
  return Response.json({ data: comment }, { status: 201 });
}
