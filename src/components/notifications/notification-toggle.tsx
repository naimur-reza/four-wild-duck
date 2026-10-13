"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function getRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.ready;
}

export function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const isSupported = "Notification" in window && "PushManager" in window && "serviceWorker" in navigator;
    setSupported(isSupported);

    if (!isSupported) return;

    getRegistration()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => setEnabled(Boolean(subscription)))
      .catch(() => setEnabled(false));
  }, []);

  async function enableNotifications() {
    const keyResponse = await fetch("/api/notifications/public-key");
    const { publicKey } = (await keyResponse.json()) as { publicKey?: string | null };

    if (!publicKey) {
      alert("Notification keys are not configured yet.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await getRegistration();
    if (!registration) return;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription)
    });

    setEnabled(true);
  }

  async function disableNotifications() {
    const registration = await getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    if (subscription) {
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      await subscription.unsubscribe();
    }

    setEnabled(false);
  }

  function handleClick() {
    startTransition(async () => {
      if (enabled) await disableNotifications();
      else await enableNotifications();
    });
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`flex h-10 w-10 items-center justify-center rounded-full border text-slate-700 shadow-sm transition disabled:opacity-60 ${
        enabled
          ? "border-teal-100 bg-teal-50 text-teal-700 hover:bg-teal-100"
          : "border-white/80 bg-white/90 hover:bg-white"
      }`}
      title={enabled ? "Notifications enabled" : "Enable notifications"}
      aria-label={enabled ? "Disable notifications" : "Enable notifications"}
    >
      {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
    </button>
  );
}
