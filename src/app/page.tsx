import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="label-eyebrow mb-3 font-bold">Date Planner</p>
      <h1 className="font-display text-gradient mb-6 max-w-md text-5xl font-bold leading-tight">
        Plan something special
      </h1>
      <p className="mb-10 max-w-sm text-muted">
        If you received a personal link, open it to start planning your date.
      </p>
      <Link
        href="/admin"
        className="link-romantic text-sm underline-offset-4 hover:underline"
      >
        Admin
      </Link>
    </main>
  );
}
