import { auth } from "@/lib/auth";
import { getStats } from "@/lib/services/work-order-service";
import { getInvoiceStats } from "@/lib/services/invoice-service";

function getDateRange(period: string) {
  const now = new Date();
  switch (period) {
    case "last_month": return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1) };
    case "last_3_months": return { from: new Date(now.getFullYear(), now.getMonth() - 3, 1), to: undefined };
    case "ytd": return { from: new Date(now.getFullYear(), 0, 1), to: undefined };
    default: return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: undefined };
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "this_month";
  const { from, to } = getDateRange(period);

  const [woStats, invoiceStats] = await Promise.all([
    getStats(from, to),
    getInvoiceStats(from, to),
  ]);

  return Response.json({
    data: {
      ...woStats,
      invoicedAmount: invoiceStats.totalAmount,
      invoiceCount: invoiceStats.count,
    },
  });
}
