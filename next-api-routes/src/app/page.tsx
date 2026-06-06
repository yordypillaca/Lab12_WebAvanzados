'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Nav } from '@/components/Nav'
import type { Author } from '@/lib/types'

const emptyAuthorForm = {
  name: '',
  email: '',
  bio: '',
  nationality: '',
  birthYear: '',
}

export default function HomePage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyAuthorForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyAuthorForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadAuthors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/authors')
      const data = await res.json()
      setAuthors(Array.isArray(data) ? data : [])
    } catch {
      setError('Error al cargar autores')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAuthors()
  }, [loadAuthors])

  const totalBooks = authors.reduce(
    (sum, a) => sum + (a._count?.books ?? a.books?.length ?? 0),
    0
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          birthYear: form.birthYear ? parseInt(form.birthYear) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear autor')
      setForm(emptyAuthorForm)
      await loadAuthors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear autor')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(author: Author) {
    setEditingId(author.id)
    setEditForm({
      name: author.name,
      email: author.email,
      bio: author.bio ?? '',
      nationality: author.nationality ?? '',
      birthYear: author.birthYear?.toString() ?? '',
    })
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/authors/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          birthYear: editForm.birthYear ? parseInt(editForm.birthYear) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar autor')
      setEditingId(null)
      await loadAuthors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar autor')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar a ${name} y todos sus libros?`)) return
    setError('')
    try {
      const res = await fetch(`/api/authors/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar autor')
      await loadAuthors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar autor')
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto min-h-[calc(100vh-65px)] w-full max-w-7xl px-4 py-8 sm:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Gestión de autores del sistema de biblioteca
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[480px]">
            <StatCard label="Total autores" value={authors.length} />
            <StatCard label="Total libros" value={totalBooks} />
            <StatCard
              label="Promedio libros/autor"
              value={
                authors.length
                  ? (totalBooks / authors.length).toFixed(1)
                  : '0'
              }
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,380px)_1fr] lg:items-start">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:sticky lg:top-6">
            <h2 className="mb-1 text-lg font-semibold">Crear autor</h2>
            <p className="mb-5 text-sm text-zinc-500">
              Registra un nuevo autor en la biblioteca
            </p>
            <form onSubmit={handleCreate} className="grid gap-4">
              <Input
                label="Nombre"
                required
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <Input
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />
              <Input
                label="Nacionalidad"
                value={form.nationality}
                onChange={(v) => setForm({ ...form, nationality: v })}
              />
              <Input
                label="Año de nacimiento"
                type="number"
                value={form.birthYear}
                onChange={(v) => setForm({ ...form, birthYear: v })}
              />
              <Input
                label="Biografía"
                value={form.bio}
                onChange={(v) => setForm({ ...form, bio: v })}
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {submitting ? 'Guardando...' : 'Crear autor'}
              </button>
            </form>
          </section>

          <section className="flex min-h-[420px] flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-semibold">Autores</h2>
                <p className="text-sm text-zinc-500">
                  {authors.length} registrado{authors.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="px-6 py-12 text-center text-zinc-500">
                  Cargando...
                </p>
              ) : authors.length === 0 ? (
                <p className="px-6 py-12 text-center text-zinc-500">
                  No hay autores registrados
                </p>
              ) : (
                <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-2">
                  {authors.map((author) => (
                    <article
                      key={author.id}
                      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      {editingId === author.id ? (
                        <form onSubmit={handleUpdate} className="grid gap-3">
                          <Input
                            label="Nombre"
                            required
                            value={editForm.name}
                            onChange={(v) =>
                              setEditForm({ ...editForm, name: v })
                            }
                          />
                          <Input
                            label="Email"
                            type="email"
                            required
                            value={editForm.email}
                            onChange={(v) =>
                              setEditForm({ ...editForm, email: v })
                            }
                          />
                          <Input
                            label="Nacionalidad"
                            value={editForm.nationality}
                            onChange={(v) =>
                              setEditForm({ ...editForm, nationality: v })
                            }
                          />
                          <Input
                            label="Biografía"
                            value={editForm.bio}
                            onChange={(v) =>
                              setEditForm({ ...editForm, bio: v })
                            }
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={submitting}
                              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="mb-3">
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                              {author.name}
                            </h3>
                            <p className="text-sm text-zinc-500">
                              {author.email}
                            </p>
                            {author.nationality && (
                              <p className="text-sm text-zinc-500">
                                {author.nationality}
                              </p>
                            )}
                            <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {author._count?.books ?? 0} libros
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              href={`/authors/${author.id}`}
                              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-center text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                            >
                              Detalle
                            </Link>
                            <Link
                              href={`/books?authorName=${encodeURIComponent(author.name)}`}
                              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-center text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                            >
                              Libros
                            </Link>
                            <button
                              onClick={() => startEdit(author)}
                              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(author.id, author.name)
                              }
                              className="rounded-lg border border-red-300 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                            >
                              Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  )
}

function Input({
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
      <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
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
