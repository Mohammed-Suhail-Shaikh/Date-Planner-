"use client";

import Link from "next/link";
import { formatDisplayName } from "@/lib/format-name";
import { getClientBaseUrl, INVITE_PATH } from "@/lib/url";
import { useEffect, useState } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";

type Invite = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  approved: "Approved",
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [newName, setNewName] = useState("");
  const [createdUrl, setCreatedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState(getClientBaseUrl);

  async function loadInvites() {
    const res = await fetch("/api/invites");
    if (res.ok) {
      const data = await res.json();
      setInvites(data.invites);
      if (data.baseUrl) setBaseUrl(data.baseUrl);
      setAuthed(true);
    }
    setChecking(false);
  }

  useEffect(() => {
    loadInvites();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setCreatedUrl("");

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    const data = await res.json();
    if (res.ok) {
      setCreatedUrl(data.url);
      setNewName("");
      loadInvites();
    }
    setLoading(false);
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
  }

  async function handleDelete(invite: Invite) {
    const confirmed = window.confirm(
      `Delete invite for ${invite.name}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(invite.id);
    const res = await fetch(`/api/invites/${invite.id}`, { method: "DELETE" });
    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      if (createdUrl.includes(invite.id)) {
        setCreatedUrl("");
      }
    }
    setDeletingId(null);
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  if (!authed) {
    return <AdminLogin onSuccess={loadInvites} />;
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-gradient text-3xl font-bold">Date Planner</h1>
          <nav className="mt-3 flex gap-4 text-sm">
            <Link href="/admin" className="link-romantic font-medium">
              Invites
            </Link>
            <Link
              href="/admin/content"
              className="text-muted hover:text-foreground"
            >
              Date content
            </Link>
          </nav>
        </div>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            setAuthed(false);
          }}
          className="text-sm text-muted hover:text-foreground"
        >
          Sign out
        </button>
      </div>

      <section className="card-romantic mb-10 p-6">
        <h2 className="mb-4 font-medium">Create new invite</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Her name"
            className="input-romantic flex-1 px-4 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-romantic px-6 py-2"
          >
            {loading ? "..." : "Create"}
          </button>
        </form>
        {createdUrl && (
          <div className="panel-romantic mt-4 p-4">
            <p className="mb-2 text-sm text-muted">Link created — copy and send:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate text-sm">{createdUrl}</code>
              <button
                type="button"
                onClick={() => copyUrl(createdUrl)}
                className="link-romantic shrink-0 text-sm hover:underline"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-medium">All invites</h2>
        {invites.length === 0 ? (
          <p className="text-muted">No invites yet. Create one above.</p>
        ) : (
          <ul className="space-y-3">
            {invites.map((invite) => {
              const url = `${baseUrl}${INVITE_PATH}/${invite.id}`;
              return (
                <li
                  key={invite.id}
                  className="card-romantic flex items-center justify-between p-4"
                >
                  <div>
                    <p className="font-medium">{formatDisplayName(invite.name)}</p>
                    <p className="text-sm text-muted">
                      {STATUS_LABELS[invite.status] || invite.status}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => copyUrl(url)}
                      className="link-romantic text-sm hover:underline"
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(invite)}
                      disabled={deletingId === invite.id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-40"
                    >
                      {deletingId === invite.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
