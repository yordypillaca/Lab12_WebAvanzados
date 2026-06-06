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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
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

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="mb-10 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold">Crear autor</h2>
          <form
            onSubmit={handleCreate}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
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
            <div className="sm:col-span-2 lg:col-span-3">
              <Input
                label="Biografía"
                value={form.bio}
                onChange={(v) => setForm({ ...form, bio: v })}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {submitting ? 'Guardando...' : 'Crear autor'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="border-b border-zinc-200 px-6 py-4 text-lg font-semibold dark:border-zinc-800">
            Autores
          </h2>

          {loading ? (
            <p className="px-6 py-8 text-center text-zinc-500">Cargando...</p>
          ) : authors.length === 0 ? (
            <p className="px-6 py-8 text-center text-zinc-500">
              No hay autores registrados
            </p>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {authors.map((author) => (
                <div key={author.id} className="px-6 py-4">
                  {editingId === author.id ? (
                    <form onSubmit={handleUpdate} className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Nombre"
                        required
                        value={editForm.name}
                        onChange={(v) => setEditForm({ ...editForm, name: v })}
                      />
                      <Input
                        label="Email"
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(v) => setEditForm({ ...editForm, email: v })}
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
                        onChange={(v) => setEditForm({ ...editForm, bio: v })}
                      />
                      <div className="flex gap-2 sm:col-span-2">
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {author.name}
                        </h3>
                        <p className="text-sm text-zinc-500">{author.email}</p>
                        {author.nationality && (
                          <p className="text-sm text-zinc-500">
                            {author.nationality}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-zinc-400">
                          {author._count?.books ?? 0} libros
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/authors/${author.id}`}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          Ver detalle
                        </Link>
                        <Link
                          href={`/books?authorName=${encodeURIComponent(author.name)}`}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          Ver libros
                        </Link>
                        <button
                          onClick={() => startEdit(author)}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(author.id, author.name)}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                        >
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
      </main>
    </>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
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
