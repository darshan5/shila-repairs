import { auth } from "@/lib/auth";
import { updateTask, completeTask } from "@/lib/services/task-service";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();

  try {
    if (body.toggleComplete) {
      const task = await completeTask(id);
      return Response.json({ data: task });
    }
    const task = await updateTask(id, body);
    return Response.json({ data: task });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}
