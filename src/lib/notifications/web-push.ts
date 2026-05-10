import webpush, { type PushSubscription } from "web-push";
import { prisma } from "@/lib/db/prisma";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

export function hasPushConfig() {
  return Boolean(publicKey && privateKey);
}

export async function notifyMessMembers({
  messId,
  actorUserId,
  payload
}: {
  messId: string;
  actorUserId?: string;
  payload: NotificationPayload;
}) {
  if (!hasPushConfig()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      messId,
      ...(actorUserId ? { userId: { not: actorUserId } } : {})
    }
  });

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;

        if ([404, 410].includes(statusCode)) {
          await prisma.pushSubscription.delete({ where: { endpoint: subscription.endpoint } }).catch(() => null);
        }
      }
    })
  );
}
