"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  countUnreadPedelNotifications,
  getPedelNotifications,
  markAllPedelNotificationsRead,
  markPedelNotificationRead,
  PEDEL_NOTIFICATIONS_UPDATED_EVENT,
  type PedelNotification,
} from "@/lib/pedel-notifications-storage";
import { MESSAGING_UPDATED_EVENT } from "@/lib/messaging-storage";
import { formatDateDaShort } from "@/lib/date-utils";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
}

export function PedelNotificationsInbox() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function onUpdate() {
      setTick((t) => t + 1);
    }
    window.addEventListener(PEDEL_NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    window.addEventListener(MESSAGING_UPDATED_EVENT, onUpdate);
    return () => {
      window.removeEventListener(PEDEL_NOTIFICATIONS_UPDATED_EVENT, onUpdate);
      window.removeEventListener(MESSAGING_UPDATED_EVENT, onUpdate);
    };
  }, []);

  const notifications = useMemo(
    () => getPedelNotifications(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );

  const unreadCount = useMemo(
    () => countUnreadPedelNotifications(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 size-5 text-blue-700" aria-hidden />
          <div>
            <CardTitle className="text-base text-blue-900">
              Beskeder fra rengøring
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-blue-700 px-2 py-0.5 text-xs font-semibold text-white">
                  {unreadCount} nye
                </span>
              )}
            </CardTitle>
            <CardDescription className="mt-1 text-blue-800/80">
              Pedelopgaver sendt via rengøring — findes også under Beskeder
            </CardDescription>
            <CardDescription className="text-blue-800/80">
              Pedelopgaver sendt af rengøringsmedarbejdere
            </CardDescription>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            className="h-8 shrink-0 border-blue-300 bg-white text-blue-900 hover:bg-blue-50"
            onClick={() => markAllPedelNotificationsRead()}
          >
            <CheckCheck className="mr-1.5 size-4" />
            Markér alle læst
          </Button>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {notifications.slice(0, 20).map((n) => (
          <NotificationRow key={n.id} notification={n} />
        ))}
      </ul>
    </Card>
  );
}

function NotificationRow({ notification }: { notification: PedelNotification }) {
  const dateLabel = formatDateDaShort(notification.createdAt.slice(0, 10));
  const timeLabel = formatTime(notification.createdAt);

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          if (!notification.read) markPedelNotificationRead(notification.id);
        }}
        className={`w-full rounded-lg px-4 py-3 text-left ring-1 transition ${
          notification.read
            ? "bg-white/60 ring-blue-100"
            : "bg-white ring-blue-300 shadow-sm"
        }`}
      >
        <p
          className={`text-sm ${
            notification.read
              ? "font-normal text-slate-700"
              : "font-semibold text-slate-900"
          }`}
        >
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Fra {notification.senderName} · {dateLabel} kl. {timeLabel}
        </p>
      </button>
    </li>
  );
}
