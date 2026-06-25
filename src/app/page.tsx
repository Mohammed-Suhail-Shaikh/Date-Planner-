import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-sm uppercase tracking-[0.2em] text-muted">
        Date Planner
      </p>
      <h1 className="font-display mb-6 max-w-md text-5xl leading-tight">
        Plan something special
      </h1>
      <p className="mb-10 max-w-sm text-muted">
        If you received a personal link, open it to start planning your date.
      </p>
      <Link
        href="/admin"
        className="text-sm text-muted underline-offset-4 hover:text-accent hover:underline"
      >
        Admin
      </Link>
    </main>
  );
}
