"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { downloadItineraryPdf } from "@/components/pdf/DateItineraryPDF";
import { compressImage, MAX_INVITE_PHOTOS } from "@/lib/compress-image";
import type { Itinerary } from "@/lib/db/schema";
import { formatDisplayName } from "@/lib/format-name";
import { formatDaysUntil } from "@/lib/dates";
import { useTodayIso } from "@/lib/use-today";
import { getClientBaseUrl, INVITE_PATH } from "@/lib/url";

type Invite = {
  id: string;
  name: string;
  status: string;
  photos?: string[];
  createdAt: string;
  dateSetOn?: string | null;
  dateIso?: string | null;
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
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [createdUrl, setCreatedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState(getClientBaseUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = useTodayIso();

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

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setPhotoError("");
    setUploadingPhotos(true);

    try {
      const next = [...photos];
      for (const file of files) {
        if (next.length >= MAX_INVITE_PHOTOS) {
          setPhotoError(`You can add up to ${MAX_INVITE_PHOTOS} photos.`);
          break;
        }
        const compressed = await compressImage(file);
        next.push(compressed);
      }
      setPhotos(next);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Could not add photo.");
    } finally {
      setUploadingPhotos(false);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoError("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setCreatedUrl("");
    setPhotoError("");

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), photos }),
    });

    const data = await res.json();
    if (res.ok) {
      setCreatedUrl(data.url);
      setNewName("");
      setPhotos([]);
      loadInvites();
    } else {
      setPhotoError(data.error || "Could not create invite.");
    }
    setLoading(false);
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
  }

  async function handleDownloadItinerary(invite: Invite) {
    setDownloadingId(invite.id);
    try {
      const res = await fetch(`/api/invites/${invite.id}`);
      if (!res.ok) {
        throw new Error("Could not load itinerary");
      }
      const data = await res.json();
      const itinerary = data.response?.itinerary as Itinerary | undefined;
      if (!itinerary) {
        window.alert("No itinerary found for this invite.");
        return;
      }
      await downloadItineraryPdf(itinerary, formatDisplayName(invite.name));
    } catch {
      window.alert("Could not download itinerary. Please try again.");
    } finally {
      setDownloadingId(null);
    }
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
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Her name"
              className="input-romantic flex-1 px-4 py-2"
            />
            <button
              type="submit"
              disabled={loading || uploadingPhotos}
              className="btn-romantic px-6 py-2"
            >
              {loading ? "..." : "Create"}
            </button>
          </div>

          <div>
            <p className="mb-2 text-sm text-muted">
              Photos (optional) — up to {MAX_INVITE_PHOTOS}, shown on her welcome page
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhotos || photos.length >= MAX_INVITE_PHOTOS}
              className="btn-romantic-outline px-4 py-2 text-sm disabled:opacity-50"
            >
              {uploadingPhotos ? "Processing..." : "Add photos"}
            </button>
            {photoError && (
              <p className="mt-2 text-sm text-red-600">{photoError}</p>
            )}
            {photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photos.map((src, i) => (
                  <div key={`${i}-${src.slice(0, 24)}`} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="h-16 w-16 rounded-lg border-2 border-white object-cover shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                    {invite.status === "pending" ? (
                      <span className="mt-0.5 inline-block rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 shadow-sm">
                        {STATUS_LABELS.pending}
                      </span>
                    ) : (
                      <p className="text-sm text-muted">
                        {STATUS_LABELS[invite.status] || invite.status}
                      </p>
                    )}
                    {invite.status === "approved" && invite.dateSetOn && (
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                        <span>Date set on:</span>
                        <span className="inline-block rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-bold text-green-700 shadow-sm">
                          {invite.dateSetOn}
                        </span>
                        {invite.dateIso && (
                          <span className="inline-block rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
                            {formatDaysUntil(invite.dateIso, today)}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => copyUrl(url)}
                      className="link-romantic text-sm hover:underline"
                    >
                      Copy link
                    </button>
                    {invite.status === "approved" && (
                      <button
                        type="button"
                        onClick={() => handleDownloadItinerary(invite)}
                        disabled={downloadingId === invite.id}
                        className="link-romantic text-sm hover:underline disabled:opacity-40"
                      >
                        {downloadingId === invite.id ? "Downloading..." : "Download PDF"}
                      </button>
                    )}
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
