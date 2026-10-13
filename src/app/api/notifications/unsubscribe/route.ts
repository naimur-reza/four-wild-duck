import { NextResponse } from "next/server";
import { requireMembership } from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";

type SubscriptionBody = {
  endpoint?: string;
};

export async function POST(request: Request) {
  const membership = await requireMembership();
  const body = (await request.json()) as SubscriptionBody;

  if (!body.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      endpoint: body.endpoint,
      userId: membership.userId
    }
  });

  return NextResponse.json({ ok: true });
}
