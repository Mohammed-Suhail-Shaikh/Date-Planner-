"use client";

import { useEffect, useState } from "react";

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
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [newName, setNewName] = useState("");
  const [createdUrl, setCreatedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadInvites() {
    const res = await fetch("/api/invites");
    if (res.ok) {
      const data = await res.json();
      setInvites(data.invites);
      setAuthed(true);
    }
    setChecking(false);
  }

  useEffect(() => {
    loadInvites();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      loadInvites();
    } else {
      setLoginError("Wrong password");
    }
  }

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
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <h1 className="font-display mb-6 text-center text-3xl">Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mb-4 w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-accent"
          />
          {loginError && (
            <p className="mb-4 text-center text-sm text-red-600">{loginError}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-accent py-3 text-white hover:opacity-90"
          >
            Sign in
          </button>
        </form>
      </main>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="font-display text-3xl">Date Planner</h1>
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

      <section className="mb-10 rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-medium">Create new invite</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Her name"
            className="flex-1 rounded-xl border border-border px-4 py-2 outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-accent px-6 py-2 text-white hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "..." : "Create"}
          </button>
        </form>
        {createdUrl && (
          <div className="mt-4 rounded-xl bg-accent-light/50 p-4">
            <p className="mb-2 text-sm text-muted">Link created — copy and send:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate text-sm">{createdUrl}</code>
              <button
                type="button"
                onClick={() => copyUrl(createdUrl)}
                className="shrink-0 text-sm text-accent hover:underline"
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
              const url = `${baseUrl}/date/${invite.id}`;
              return (
                <li
                  key={invite.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-medium">{invite.name}</p>
                    <p className="text-sm text-muted">
                      {STATUS_LABELS[invite.status] || invite.status}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => copyUrl(url)}
                      className="text-sm text-accent hover:underline"
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
