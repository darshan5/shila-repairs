import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.AUTH_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.user.findFirst();
  if (existing) return Response.json({ message: "Already seeded" });

  const password = await bcrypt.hash("repair123", 10);
  const user = await prisma.user.create({
    data: { name: "Admin", email: "admin@shilallc.com", password, role: "admin" },
  });

  await prisma.appConfig.upsert({
    where: { id: "config" },
    update: {},
    create: { id: "config" },
  });

  return Response.json({ message: "Setup complete", userId: user.id, credentials: { email: "admin@shilallc.com", password: "repair123" } });
}
