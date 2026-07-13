import { NextResponse } from "next/server";
import { closeOpenMonth, getMonthEndFromLabel } from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";
import { notifyMessMembers } from "@/lib/notifications/web-push";

function isAuthorized(request: Request) {
  if (process.env.CRON === "1") return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messes = await prisma.mess.findMany({
    where: { autoCloseEnabled: true },
    select: { id: true, closeGracePeriodDays: true },
  });

  const results: Array<{ messId: string; monthId: string; label: string }> = [];

  for (const mess of messes) {
    const openMonth = await prisma.month.findFirst({
      where: { messId: mess.id, status: "OPEN" },
      orderBy: { createdAt: "desc" },
    });

    if (!openMonth) continue;

    const monthEnd = getMonthEndFromLabel(openMonth.label);
    const graceDate = new Date(monthEnd);
    graceDate.setDate(graceDate.getDate() + mess.closeGracePeriodDays);

    if (new Date() <= graceDate) continue;

    try {
      await closeOpenMonth(mess.id, openMonth.id);

      await notifyMessMembers({
        messId: mess.id,
        payload: {
          title: "Month auto-closed",
          body: `${openMonth.label} has been closed automatically. Check the final report and carried balances.`,
          url: "/reports",
        },
      });

      results.push({ messId: mess.id, monthId: openMonth.id, label: openMonth.label });
    } catch {
      // continue with next mess
    }
  }

  return NextResponse.json({ closed: results.length, results });
}
