import Link from 'next/link'

export function Nav() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
        >
          Biblioteca
        </Link>
        <nav className="flex gap-4 text-sm font-medium">
          <Link
            href="/"
            className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Dashboard
          </Link>
          <Link
            href="/books"
            className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Libros
          </Link>
        </nav>
      </div>
    </header>
  )
}
