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
          <main className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-8">
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
      <main className="min-h-[calc(100vh-57px)] w-full bg-zinc-100/80 px-4 py-6 dark:bg-zinc-950 sm:px-6">
        <div className="mx-auto w-full max-w-[1440px] space-y-5">
          {/* Encabezado */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Catálogo de libros
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Busca, filtra y administra tu biblioteca
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatPill
                label="Encontrados"
                value={loading ? '…' : String(pagination?.total ?? 0)}
              />
              {pagination && (
                <StatPill
                  label="Página"
                  value={`${pagination.page}/${pagination.totalPages}`}
                />
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Barra de filtros */}
          <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Filtros
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                Limpiar todo
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Field
                label="Título"
                value={search}
                onChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
                placeholder="Buscar..."
              />
              <Select
                label="Género"
                value={genre}
                onChange={(v) => {
                  setGenre(v)
                  setPage(1)
                }}
                options={[
                  { value: '', label: 'Todos' },
                  ...genres.map((g) => ({ value: g, label: g })),
                ]}
              />
              <Select
                label="Autor"
                value={authorName}
                onChange={(v) => {
                  setAuthorName(v)
                  setPage(1)
                }}
                options={[
                  { value: '', label: 'Todos' },
                  ...authors.map((a) => ({ value: a.name, label: a.name })),
                ]}
              />
              <Select
                label="Ordenar"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'createdAt', label: 'Fecha' },
                  { value: 'title', label: 'Título' },
                  { value: 'publishedYear', label: 'Año' },
                ]}
              />
              <Select
                label="Dirección"
                value={order}
                onChange={setOrder}
                options={[
                  { value: 'desc', label: 'Descendente' },
                  { value: 'asc', label: 'Ascendente' },
                ]}
              />
            </div>
          </section>

          {/* Formulario colapsable */}
          <details className="group rounded-2xl border border-zinc-200/80 bg-white shadow-sm open:pb-2 dark:border-zinc-800 dark:bg-zinc-900">
            <summary className="cursor-pointer list-none px-5 py-4 font-medium text-zinc-900 marker:content-none dark:text-zinc-50 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
                  +
                </span>
                Agregar nuevo libro
              </span>
            </summary>
            <form
              onSubmit={handleCreate}
              className="grid gap-3 border-t border-zinc-100 px-5 pb-4 pt-4 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-4"
            >
              <Field label="Título" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Field label="ISBN" value={form.isbn} onChange={(v) => setForm({ ...form, isbn: v })} />
              <Field label="Género" value={form.genre} onChange={(v) => setForm({ ...form, genre: v })} />
              <Select
                label="Autor"
                required
                value={form.authorId}
                onChange={(v) => setForm({ ...form, authorId: v })}
                options={[
                  { value: '', label: 'Seleccionar' },
                  ...authors.map((a) => ({ value: a.id, label: a.name })),
                ]}
              />
              <Field label="Año" type="number" value={form.publishedYear} onChange={(v) => setForm({ ...form, publishedYear: v })} />
              <Field label="Páginas" type="number" value={form.pages} onChange={(v) => setForm({ ...form, pages: v })} />
              <div className="sm:col-span-2">
                <Field label="Descripción" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {submitting ? 'Guardando...' : 'Crear libro'}
                </button>
              </div>
            </form>
          </details>

          {/* Grid de libros */}
          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-200/80 bg-white py-24 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <Spinner />
              <span className="text-zinc-500">Cargando libros...</span>
            </div>
          ) : books.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-24 text-center text-zinc-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              No se encontraron libros con estos filtros
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  editing={editingId === book.id}
                  editForm={editForm}
                  submitting={submitting}
                  onEditFormChange={setEditForm}
                  onStartEdit={() => startEdit(book)}
                  onCancelEdit={() => setEditingId(null)}
                  onUpdate={handleUpdate}
                  onDelete={() => handleDelete(book.id, book.title)}
                />
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-zinc-200/80 bg-white px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <PaginationBtn
                disabled={!pagination.hasPrev || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </PaginationBtn>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <PaginationBtn
                    key={p}
                    active={p === pagination.page}
                    disabled={loading}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </PaginationBtn>
                )
              )}
              <PaginationBtn
                disabled={!pagination.hasNext || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </PaginationBtn>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

const inputClass =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm transition dark:border-zinc-700 dark:bg-zinc-950'

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-2 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  )
}

function BookCard({
  book,
  editing,
  editForm,
  submitting,
  onEditFormChange,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
}: {
  book: Book
  editing: boolean
  editForm: typeof emptyBookForm
  submitting: boolean
  onEditFormChange: (f: typeof emptyBookForm) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onUpdate: (e: React.FormEvent) => void
  onDelete: () => void
}) {
  if (editing) {
    return (
      <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={onUpdate} className="grid gap-3">
          <Field label="Título" required value={editForm.title} onChange={(v) => onEditFormChange({ ...editForm, title: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Género" value={editForm.genre} onChange={(v) => onEditFormChange({ ...editForm, genre: v })} />
            <Field label="Año" type="number" value={editForm.publishedYear} onChange={(v) => onEditFormChange({ ...editForm, publishedYear: v })} />
          </div>
          <Field label="Páginas" type="number" value={editForm.pages} onChange={(v) => onEditFormChange({ ...editForm, pages: v })} />
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
              Guardar
            </button>
            <button type="button" onClick={onCancelEdit} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600">
              Cancelar
            </button>
          </div>
        </form>
      </article>
    )
  }

  return (
    <article className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
            {book.title}
          </h3>
          <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {book.genre ?? '—'}
          </span>
        </div>
        <p className="text-sm text-zinc-500">{book.author?.name ?? 'Sin autor'}</p>
      </div>
      <div className="flex flex-1 flex-col px-5 py-3">
        <div className="mb-3 flex gap-3 text-xs text-zinc-500">
          <span>{book.publishedYear ?? '—'}</span>
          <span>·</span>
          <span>{book.pages ?? '—'} págs.</span>
          {book.isbn && (
            <>
              <span>·</span>
              <span className="truncate">{book.isbn}</span>
            </>
          )}
        </div>
        {book.description && (
          <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {book.description}
          </p>
        )}
        <div className="mt-auto flex gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {book.author && (
            <Link
              href={`/authors/${book.author.id}`}
              className="flex-1 rounded-lg border border-zinc-200 py-2 text-center text-xs font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Autor
            </Link>
          )}
          <button
            onClick={onStartEdit}
            className="flex-1 rounded-lg border border-zinc-200 py-2 text-xs font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="flex-1 rounded-lg border border-red-200 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Eliminar
          </button>
        </div>
      </div>
    </article>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-500">{label}</span>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function PaginationBtn({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-sm transition disabled:opacity-40 ${
        active
          ? 'bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900'
          : 'border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
      }`}
    >
      {children}
    </button>
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
      <span className="mb-1.5 block text-xs font-medium text-zinc-500">
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  )
}

function Spinner() {
  return (
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
  )
}
