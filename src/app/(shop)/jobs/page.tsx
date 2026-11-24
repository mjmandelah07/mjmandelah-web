"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatWhen } from "@/lib/format";
import { isManager, type JobRow } from "@/lib/models";
import { useSession } from "@/components/session";
import { Card, DataTable, Notice, PageHeader, Status } from "@/components/ui";

export default function JobsPage() {
  const { user } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<JobRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !isManager(user.role)) router.replace("/");
  }, [router, user]);

  useEffect(() => {
    if (!user || !isManager(user.role)) return;
    api<JobRow[]>("/jobs")
      .then(setRows)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load jobs"));
  }, [user]);

  return (
    <div>
      <PageHeader title="Jobs" description="Receipt archives queued after each sale." />
      {error ? <div className="mb-4"><Notice>{error}</Notice></div> : null}
      <Card>
        <DataTable
          rows={rows}
          rowKey={(row) => row.id}
          empty="No jobs yet. A receipt archive is queued after each sale."
          columns={[
            { key: "type", label: "Type", render: (row) => row.type },
            { key: "status", label: "Status", render: (row) => <Status value={row.status} /> },
            { key: "attempts", label: "Attempts", render: (row) => row.attempts },
            { key: "when", label: "Created", render: (row) => formatWhen(row.createdAt) },
            { key: "error", label: "Last error", render: (row) => row.lastError || "—" },
          ]}
        />
      </Card>
    </div>
  );
}
