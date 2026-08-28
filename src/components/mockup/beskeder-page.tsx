"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Inbox,
  Mail,
  MailOpen,
  Send,
  Users,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { listAllUsers } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";
import { formatDateDaShort } from "@/lib/date-utils";
import {
  DEPARTMENTS,
  formatRecipientLabel,
} from "@/lib/messaging-departments";
import {
  getInboxForUser,
  getSentByUser,
  isMessageUnread,
  markAllInboxRead,
  markMessageRead,
  MESSAGING_UPDATED_EVENT,
  sendMessage,
  countUnreadForUser,
} from "@/lib/messaging-storage";
import type { PlatformMessage } from "@/lib/messaging-types";
import type { UserRole } from "@/lib/auth-types";

type Tab = "inbox" | "sent" | "compose";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BeskederPage({ basePath = "/beskeder" }: { basePath?: string }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    function onUpdate() {
      reload();
    }
    window.addEventListener(MESSAGING_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(MESSAGING_UPDATED_EVENT, onUpdate);
  }, [reload]);

  const inbox = useMemo(
    () => (user ? getInboxForUser(user.id, user.role) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, tick],
  );

  const sent = useMemo(
    () => (user ? getSentByUser(user.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, tick],
  );

  const unreadCount = useMemo(
    () => (user ? inbox.filter((m) => isMessageUnread(m, user.id)).length : 0),
    [inbox, user],
  );

  const selected = useMemo(() => {
    const list = tab === "sent" ? sent : inbox;
    return list.find((m) => m.id === selectedId) ?? null;
  }, [tab, inbox, sent, selectedId]);

  function openMessage(message: PlatformMessage, fromTab: Tab) {
    setSelectedId(message.id);
    if (fromTab === "inbox" && user && isMessageUnread(message, user.id)) {
      markMessageRead(message.id, user.id);
      reload();
    }
  }

  if (!user) {
    return (
      <Card>
        <CardDescription>Log ind for at se beskeder.</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-violet-700" />
            <h1 className="text-2xl font-bold text-slate-900">Beskeder</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Send beskeder til kolleger eller hele afdelinger
          </p>
        </div>
        <Button onClick={() => setTab("compose")}>
          <Send className="mr-1.5 h-4 w-4" />
          Skriv besked
        </Button>
      </div>

      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
        <TabBtn
          active={tab === "inbox"}
          onClick={() => {
            setTab("inbox");
            setSelectedId(null);
          }}
          icon={Inbox}
          label={`Indbakke${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
        />
        <TabBtn
          active={tab === "sent"}
          onClick={() => {
            setTab("sent");
            setSelectedId(null);
          }}
          icon={Send}
          label="Sendt"
        />
        <TabBtn
          active={tab === "compose"}
          onClick={() => setTab("compose")}
          icon={Mail}
          label="Skriv ny"
        />
      </div>

      {tab === "compose" ? (
        <ComposeForm
          user={user}
          onSent={() => {
            reload();
            setTab("sent");
            setSelectedId(null);
          }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <CardTitle className="text-base">
                {tab === "inbox" ? "Modtaget" : "Sendt"}
              </CardTitle>
              {tab === "inbox" && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    markAllInboxRead(user.id, user.role);
                    reload();
                  }}
                  className="text-xs font-medium text-violet-700 hover:underline"
                >
                  Markér alle læst
                </button>
              )}
            </div>
            {(tab === "inbox" ? inbox : sent).length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                {tab === "inbox" ? "Ingen beskeder endnu." : "Du har ikke sendt beskeder endnu."}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
                {(tab === "inbox" ? inbox : sent).map((message) => {
                  const unread =
                    tab === "inbox" && isMessageUnread(message, user.id);
                  return (
                    <li key={message.id}>
                      <button
                        type="button"
                        onClick={() => openMessage(message, tab)}
                        className={cn(
                          "w-full px-1 py-3 text-left transition hover:bg-slate-50",
                          selectedId === message.id && "bg-violet-50",
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {unread ? (
                            <Mail className="mt-0.5 size-4 shrink-0 text-violet-600" />
                          ) : (
                            <MailOpen className="mt-0.5 size-4 shrink-0 text-slate-400" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "truncate text-sm",
                                unread
                                  ? "font-semibold text-slate-900"
                                  : "font-medium text-slate-700",
                              )}
                            >
                              {tab === "inbox"
                                ? message.senderName
                                : formatRecipientLabel(message)}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {message.subject}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {formatDateDaShort(message.createdAt.slice(0, 10))}{" "}
                              kl. {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="lg:col-span-3">
            {selected ? (
              <MessageDetail message={selected} tab={tab} />
            ) : (
              <div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
                Vælg en besked for at læse den
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Inbox;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-white text-violet-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MessageDetail({
  message,
  tab,
}: {
  message: PlatformMessage;
  tab: Tab;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{message.subject}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {tab === "inbox" ? (
            <>
              Fra <strong>{message.senderName}</strong>
            </>
          ) : (
            <>
              Til{" "}
              <strong>{formatRecipientLabel(message)}</strong>
              {message.recipientType === "department" && (
                <span className="ml-1 inline-flex items-center gap-0.5 text-violet-700">
                  <Users className="size-3.5" />
                  afdeling
                </span>
              )}
            </>
          )}
          {" · "}
          {formatDateDaShort(message.createdAt.slice(0, 10))} kl.{" "}
          {formatTime(message.createdAt)}
        </p>
      </div>
      <div className="whitespace-pre-wrap rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-800">
        {message.body}
      </div>
      {message.source === "rengoring-pedel" && (
        <p className="text-xs text-slate-500">
          Sendt som pedelopgave fra rengøring
        </p>
      )}
    </div>
  );
}

function ComposeForm({
  user,
  onSent,
}: {
  user: { id: string; name: string; role: string };
  onSent: () => void;
}) {
  const [recipientKind, setRecipientKind] = useState<"user" | "department">(
    "department",
  );
  const [recipientUserId, setRecipientUserId] = useState("");
  const [recipientDepartmentId, setRecipientDepartmentId] = useState("pedel");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const users = useMemo(
    () =>
      listAllUsers()
        .filter((u) => u.id !== user.id)
        .sort((a, b) => a.name.localeCompare(b.name, "da")),
    [user.id],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);

    let result = null;

    if (recipientKind === "user") {
      const recipient = users.find((u) => u.id === recipientUserId);
      if (!recipient) {
        setError("Vælg en modtager.");
        setSending(false);
        return;
      }
      result = sendMessage({
        senderId: user.id,
        senderName: user.name,
        recipientType: "user",
        recipientUserId: recipient.id,
        recipientUserName: recipient.name,
        subject,
        body,
      });
    } else {
      const dept = DEPARTMENTS.find((d) => d.id === recipientDepartmentId);
      if (!dept) {
        setError("Vælg en afdeling.");
        setSending(false);
        return;
      }
      result = sendMessage({
        senderId: user.id,
        senderName: user.name,
        recipientType: "department",
        recipientDepartmentId: dept.id,
        recipientDepartmentName: dept.label,
        subject,
        body,
      });
    }

    setSending(false);

    if (!result) {
      setError("Beskeden kunne ikke sendes — tjek at teksten er udfyldt.");
      return;
    }

    setSubject("");
    setBody("");
    onSent();
  }

  return (
    <Card>
      <CardTitle className="text-base">Ny besked</CardTitle>
      <CardDescription className="mt-1">
        Send til én person eller til alle i en afdeling
      </CardDescription>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Modtager</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRecipientKind("department")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                recipientKind === "department"
                  ? "bg-violet-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              <Users className="h-4 w-4" />
              Afdeling
            </button>
            <button
              type="button"
              onClick={() => setRecipientKind("user")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                recipientKind === "user"
                  ? "bg-violet-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              <User className="h-4 w-4" />
              Person
            </button>
          </div>
        </div>

        {recipientKind === "department" ? (
          <Field label="Afdeling">
            <select
              value={recipientDepartmentId}
              onChange={(e) => setRecipientDepartmentId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Person">
            <select
              value={recipientUserId}
              onChange={(e) => setRecipientUserId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            >
              <option value="">Vælg modtager…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Emne">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Kort emne"
          />
        </Field>

        <Field label="Besked">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Skriv din besked…"
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <Button type="submit" disabled={sending}>
          {sending ? "Sender…" : "Send besked"}
        </Button>
      </form>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function MessagingUnreadBadge({
  userId,
  role,
}: {
  userId: string;
  role: UserRole;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function refresh() {
      setCount(countUnreadForUser(userId, role));
    }
    refresh();
    window.addEventListener(MESSAGING_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(MESSAGING_UPDATED_EVENT, refresh);
  }, [userId, role]);

  if (count <= 0) return null;

  return (
    <span className="ml-auto rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
      {count}
    </span>
  );
}
