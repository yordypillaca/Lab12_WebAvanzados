'use client'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Nav } from '@/components/Nav'
import type { Author, Book, SearchResponse } from '@/lib/types'

const emptyBookForm = {
  title: '',
  description: '',
  isbn: '',
  publishedYear: '',
  genre: '',
  pages: '',
  authorId: '',
}

export default function BooksPage() {
  return (
    <Suspense
      fallback={
        <>
          <Nav />
          <main className="mx-auto max-w-6xl px-4 py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            <p className="mt-4 text-zinc-500">Cargando...</p>
          </main>
        </>
      }
    >
      <BooksPageContent />
    </Suspense>
  )
}

function BooksPageContent() {
  const searchParams = useSearchParams()
  const initialAuthorName = searchParams.get('authorName') ?? ''

  const [authors, setAuthors] = useState<Author[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null)
  const [genres, setGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [authorName, setAuthorName] = useState(initialAuthorName)
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const [form, setForm] = useState(emptyBookForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyBookForm)

  const loadAuthors = useCallback(async () => {
    const res = await fetch('/api/authors')
    const data = await res.json()
    if (Array.isArray(data)) setAuthors(data)
  }, [])

  const loadGenres = useCallback(async () => {
    const res = await fetch('/api/books')
    const data = await res.json()
    if (Array.isArray(data)) {
      const unique = [
        ...new Set(
          data.map((b: Book) => b.genre).filter((g): g is string => !!g)
        ),
      ].sort()
      setGenres(unique)
    }
  }, [])

  const searchBooks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        order,
      })
      if (search) params.set('search', search)
      if (genre) params.set('genre', genre)
      if (authorName) params.set('authorName', authorName)

      const res = await fetch(`/api/books/search?${params}`)
      const data: SearchResponse = await res.json()
      if (!res.ok) throw new Error((data as unknown as { error: string }).error)

      setBooks(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la búsqueda')
    } finally {
      setLoading(false)
    }
  }, [search, genre, authorName, sortBy, order, page, limit])

  useEffect(() => {
    loadAuthors()
    loadGenres()
  }, [loadAuthors, loadGenres])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchBooks()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchBooks])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          publishedYear: form.publishedYear
            ? parseInt(form.publishedYear)
            : null,
          pages: form.pages ? parseInt(form.pages) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear libro')
      setForm(emptyBookForm)
      await loadGenres()
      await searchBooks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear libro')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(book: Book) {
    setEditingId(book.id)
    setEditForm({
      title: book.title,
      description: book.description ?? '',
      isbn: book.isbn ?? '',
      publishedYear: book.publishedYear?.toString() ?? '',
      genre: book.genre ?? '',
      pages: book.pages?.toString() ?? '',
      authorId: book.authorId,
    })
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/books/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          publishedYear: editForm.publishedYear
            ? parseInt(editForm.publishedYear)
            : null,
          pages: editForm.pages ? parseInt(editForm.pages) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar libro')
      setEditingId(null)
      await loadGenres()
      await searchBooks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar libro')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar "${title}"?`)) return
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar libro')
      await searchBooks()
      await loadGenres()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar libro')
    }
  }

  function resetFilters() {
    setSearch('')
    setGenre('')
    setAuthorName('')
    setSortBy('createdAt')
    setOrder('desc')
    setPage(1)
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold">Búsqueda de libros</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold">Crear libro</h2>
          <form
            onSubmit={handleCreate}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Field label="Título" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Field label="ISBN" value={form.isbn} onChange={(v) => setForm({ ...form, isbn: v })} />
            <Field label="Género" value={form.genre} onChange={(v) => setForm({ ...form, genre: v })} />
            <Field label="Año" type="number" value={form.publishedYear} onChange={(v) => setForm({ ...form, publishedYear: v })} />
            <Field label="Páginas" type="number" value={form.pages} onChange={(v) => setForm({ ...form, pages: v })} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Autor</span>
              <select
                required
                value={form.authorId}
                onChange={(e) => setForm({ ...form, authorId: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">Seleccionar autor</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Descripción" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            </div>
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {submitting ? 'Guardando...' : 'Crear libro'}
              </button>
            </div>
          </form>
        </section>

        <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Buscar por título"
              value={search}
              onChange={(v) => { setSearch(v); setPage(1) }}
              placeholder="Ingrese el título del libro"
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Género</span>
              <select
                value={genre}
                onChange={(e) => { setGenre(e.target.value); setPage(1) }}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">Todos los géneros</option>
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Autor</span>
              <select
                value={authorName}
                onChange={(e) => { setAuthorName(e.target.value); setPage(1) }}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">Todos los autores</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Ordenar por</span>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="createdAt">Fecha creación</option>
                  <option value="title">Título</option>
                  <option value="publishedYear">Año publicación</option>
                </select>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </label>
          </div>
          <button
            onClick={resetFilters}
            className="mt-4 text-sm text-zinc-500 underline hover:text-zinc-700"
          >
            Limpiar filtros
          </button>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {loading
              ? 'Buscando...'
              : pagination
                ? `${pagination.total} resultado${pagination.total !== 1 ? 's' : ''} encontrado${pagination.total !== 1 ? 's' : ''}`
                : ''}
          </p>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16">
              <Spinner />
              <span className="text-zinc-500">Cargando libros...</span>
            </div>
          ) : books.length === 0 ? (
            <p className="px-6 py-16 text-center text-zinc-500">
              No se encontraron libros
            </p>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {books.map((book) => (
                <div key={book.id} className="px-6 py-4">
                  {editingId === book.id ? (
                    <form onSubmit={handleUpdate} className="grid gap-3 sm:grid-cols-2">
                      <Field label="Título" required value={editForm.title} onChange={(v) => setEditForm({ ...editForm, title: v })} />
                      <Field label="Género" value={editForm.genre} onChange={(v) => setEditForm({ ...editForm, genre: v })} />
                      <Field label="Páginas" type="number" value={editForm.pages} onChange={(v) => setEditForm({ ...editForm, pages: v })} />
                      <Field label="Año" type="number" value={editForm.publishedYear} onChange={(v) => setEditForm({ ...editForm, publishedYear: v })} />
                      <div className="flex gap-2 sm:col-span-2">
                        <button type="submit" disabled={submitting} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
                          Guardar
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border px-3 py-1.5 text-sm">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="font-semibold">{book.title}</h3>
                        <p className="text-sm text-zinc-500">
                          {book.author?.name ?? 'Sin autor'} · {book.genre ?? 'Sin género'} · {book.publishedYear ?? '—'} · {book.pages ?? '—'} págs.
                        </p>
                        {book.description && (
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{book.description}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {book.author && (
                          <Link href={`/authors/${book.author.id}`} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                            Ver autor
                          </Link>
                        )}
                        <button onClick={() => startEdit(book)} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(book.id, book.title)} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              disabled={!pagination.hasPrev || loading}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Anterior
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                disabled={loading}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  p === pagination.page
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={!pagination.hasNext || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </main>
    </>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />
    </label>
  )
}

function Spinner() {
  return (
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
  )
}
