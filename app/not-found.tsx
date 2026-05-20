import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-slate-500 dark:text-slate-400">
        The page you were looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-md border border-slate-300 px-6 py-3 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
      >
        Back to search
      </Link>
    </main>
  );
}
