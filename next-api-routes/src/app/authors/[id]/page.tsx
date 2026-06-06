'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Nav } from '@/components/Nav'
import type { Author, AuthorStats, Book } from '@/lib/types'

const emptyBookForm = {
  title: '',
  description: '',
  isbn: '',
  publishedYear: '',
  genre: '',
  pages: '',
}

export default function AuthorDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [author, setAuthor] = useState<Author | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [stats, setStats] = useState<AuthorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [showBookForm, setShowBookForm] = useState(false)

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    bio: '',
    nationality: '',
    birthYear: '',
  })
  const [bookForm, setBookForm] = useState(emptyBookForm)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [authorRes, booksRes, statsRes] = await Promise.all([
        fetch(`/api/authors/${id}`),
        fetch(`/api/authors/${id}/books`),
        fetch(`/api/authors/${id}/stats`),
      ])

      if (!authorRes.ok) throw new Error('Autor no encontrado')

      const authorData = await authorRes.json()
      const booksData = await booksRes.json()
      const statsData = await statsRes.json()

      setAuthor(authorData)
      setBooks(booksData.books ?? [])
      setStats(statsData)
      setEditForm({
        name: authorData.name,
        email: authorData.email,
        bio: authorData.bio ?? '',
        nationality: authorData.nationality ?? '',
        birthYear: authorData.birthYear?.toString() ?? '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleUpdateAuthor(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          birthYear: editForm.birthYear ? parseInt(editForm.birthYear) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar')
      setEditing(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar autor')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateBook(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookForm,
          authorId: id,
          publishedYear: bookForm.publishedYear
            ? parseInt(bookForm.publishedYear)
            : null,
          pages: bookForm.pages ? parseInt(bookForm.pages) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear libro')
      setBookForm(emptyBookForm)
      setShowBookForm(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear libro')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          <p className="mt-4 text-zinc-500">Cargando autor...</p>
        </main>
      </>
    )
  }

  if (!author) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-red-600">{error || 'Autor no encontrado'}</p>
          <Link href="/" className="mt-4 inline-block text-sm underline">
            Volver al dashboard
          </Link>
        </main>
      </>
    )
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/" className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-700">
          ← Volver al dashboard
        </Link>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{author.name}</h1>
            <p className="text-zinc-500">{author.email}</p>
            {author.nationality && (
              <p className="text-sm text-zinc-500">{author.nationality}</p>
            )}
            {author.birthYear && (
              <p className="text-sm text-zinc-500">Nacimiento: {author.birthYear}</p>
            )}
            {author.bio && (
              <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">{author.bio}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              {editing ? 'Cancelar edición' : 'Editar autor'}
            </button>
            <button
              onClick={() => setShowBookForm(!showBookForm)}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Agregar libro
            </button>
          </div>
        </div>

        {editing && (
          <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold">Editar autor</h2>
            <form onSubmit={handleUpdateAuthor} className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" required value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
              <Field label="Email" type="email" required value={editForm.email} onChange={(v) => setEditForm({ ...editForm, email: v })} />
              <Field label="Nacionalidad" value={editForm.nationality} onChange={(v) => setEditForm({ ...editForm, nationality: v })} />
              <Field label="Año nacimiento" type="number" value={editForm.birthYear} onChange={(v) => setEditForm({ ...editForm, birthYear: v })} />
              <div className="sm:col-span-2">
                <Field label="Biografía" value={editForm.bio} onChange={(v) => setEditForm({ ...editForm, bio: v })} />
              </div>
              <button type="submit" disabled={submitting} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
                {submitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </section>
        )}

        {showBookForm && (
          <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold">Nuevo libro</h2>
            <form onSubmit={handleCreateBook} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Título" required value={bookForm.title} onChange={(v) => setBookForm({ ...bookForm, title: v })} />
              <Field label="ISBN" value={bookForm.isbn} onChange={(v) => setBookForm({ ...bookForm, isbn: v })} />
              <Field label="Género" value={bookForm.genre} onChange={(v) => setBookForm({ ...bookForm, genre: v })} />
              <Field label="Año" type="number" value={bookForm.publishedYear} onChange={(v) => setBookForm({ ...bookForm, publishedYear: v })} />
              <Field label="Páginas" type="number" value={bookForm.pages} onChange={(v) => setBookForm({ ...bookForm, pages: v })} />
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Descripción" value={bookForm.description} onChange={(v) => setBookForm({ ...bookForm, description: v })} />
              </div>
              <button type="submit" disabled={submitting} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
                {submitting ? 'Creando...' : 'Crear libro'}
              </button>
            </form>
          </section>
        )}

        {stats && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">Estadísticas</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total libros" value={stats.totalBooks} />
              <StatCard label="Promedio páginas" value={stats.averagePages} />
              <StatCard
                label="Primer libro"
                value={stats.firstBook ? `${stats.firstBook.title} (${stats.firstBook.year})` : '—'}
              />
              <StatCard
                label="Último libro"
                value={stats.latestBook ? `${stats.latestBook.title} (${stats.latestBook.year})` : '—'}
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {stats.longestBook && (
                <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500">Libro más largo</p>
                  <p className="font-medium">{stats.longestBook.title}</p>
                  <p className="text-sm text-zinc-500">{stats.longestBook.pages} páginas</p>
                </div>
              )}
              {stats.shortestBook && (
                <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500">Libro más corto</p>
                  <p className="font-medium">{stats.shortestBook.title}</p>
                  <p className="text-sm text-zinc-500">{stats.shortestBook.pages} páginas</p>
                </div>
              )}
            </div>
            {stats.genres.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm text-zinc-500">Géneros</p>
                <div className="flex flex-wrap gap-2">
                  {stats.genres.map((g) => (
                    <span key={g} className="rounded-full bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="border-b border-zinc-200 px-6 py-4 text-lg font-semibold dark:border-zinc-800">
            Libros ({books.length})
          </h2>
          {books.length === 0 ? (
            <p className="px-6 py-8 text-center text-zinc-500">Este autor no tiene libros</p>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {books.map((book) => (
                <div key={book.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-medium">{book.title}</h3>
                    <p className="text-sm text-zinc-500">
                      {book.genre ?? 'Sin género'} · {book.publishedYear ?? '—'} · {book.pages ?? '—'} págs.
                    </p>
                  </div>
                  <Link
                    href={`/books?search=${encodeURIComponent(book.title)}`}
                    className="text-sm text-zinc-500 underline hover:text-zinc-700"
                  >
                    Ver en catálogo
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />
    </label>
  )
}
