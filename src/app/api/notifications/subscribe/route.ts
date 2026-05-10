import { NextResponse } from "next/server";
import { requireMembership } from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";

type SubscriptionBody = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
  const membership = await requireMembership();
  const body = (await request.json()) as SubscriptionBody;

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: {
      messId: membership.messId,
      userId: membership.userId,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: request.headers.get("user-agent")
    },
    create: {
      messId: membership.messId,
      userId: membership.userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: request.headers.get("user-agent")
    }
  });

  return NextResponse.json({ ok: true });
}
