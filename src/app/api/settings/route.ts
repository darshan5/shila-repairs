import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let config = await prisma.appConfig.findUnique({ where: { id: "config" } });
  if (!config) {
    config = await prisma.appConfig.create({ data: { id: "config" } });
  }

  return Response.json({
    data: {
      walkTheFloorUrl: config.walkTheFloorUrl,
      hasApiKey: !!config.walkTheFloorApiKey,
      lastSyncAt: config.lastSyncAt,
      lastSyncError: config.lastSyncError,
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: any = {};
  if (body.walkTheFloorUrl) data.walkTheFloorUrl = body.walkTheFloorUrl;
  if (body.walkTheFloorApiKey) data.walkTheFloorApiKey = body.walkTheFloorApiKey;

  const config = await prisma.appConfig.upsert({
    where: { id: "config" },
    update: data,
    create: { id: "config", ...data },
  });

  return Response.json({
    data: { walkTheFloorUrl: config.walkTheFloorUrl, hasApiKey: !!config.walkTheFloorApiKey },
  });
}
