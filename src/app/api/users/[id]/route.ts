import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, context: { params: Promise<Record<string, string>> }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  if ((session.user as any).id === id) {
    return Response.json({ error: "Cannot deactivate yourself" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  await prisma.user.update({ where: { id }, data: { isActive: false } });
  return Response.json({ data: { deactivated: true } });
}
