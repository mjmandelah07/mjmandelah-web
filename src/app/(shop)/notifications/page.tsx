"use client";

import { useEffect, useState } from "react";
import { api, qs } from "@/lib/api";
import { formatWhen } from "@/lib/format";
import type { Notification, Page } from "@/lib/models";
import { Button, Card, Notice, PageHeader } from "@/components/ui";

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [rows, setRows] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  function load(nextUnread = unreadOnly) {
    api<Page<Notification>>(`/notifications${qs({ unreadOnly: nextUnread, pageSize: 40 })}`)
      .then((page) => setRows(page.data))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load alerts"));
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function mark(id: string) {
    await api(`/notifications/${id}/read`, { method: "PATCH" });
    load();
  }

  async function markAll() {
    await api("/notifications/read-all", { method: "PATCH" });
    load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Shelf"
        title="Alerts"
        action={<Button type="button" tone="paper" onClick={markAll}>Mark all read</Button>}
      />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={unreadOnly}
          onChange={(event) => {
            setUnreadOnly(event.target.checked);
            load(event.target.checked);
          }}
        />
        Unread only
      </label>
      <div className="grid gap-3">
        {rows.length === 0 ? <Card><p className="text-sm text-muted">No alerts.</p></Card> : null}
        {rows.map((row) => (
          <Card key={row.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-clay">{row.type.replaceAll("_", " ")}</p>
                <h2 className="font-display text-2xl">{row.title}</h2>
                <p className="text-sm">{row.message}</p>
                <p className="mt-1 text-xs text-muted">{formatWhen(row.createdAt)}</p>
              </div>
              {!row.isRead ? (
                <Button type="button" tone="paper" onClick={() => mark(row.id)}>Mark read</Button>
              ) : (
                <span className="text-xs text-muted">Read</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
