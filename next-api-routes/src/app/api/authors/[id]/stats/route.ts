import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const author = await prisma.author.findUnique({
      where: { id },
      include: { books: true },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    const { books } = author
    const totalBooks = books.length

    const booksWithYear = books
      .filter((b) => b.publishedYear !== null)
      .sort((a, b) => (a.publishedYear ?? 0) - (b.publishedYear ?? 0))

    const firstBook = booksWithYear[0] ?? null
    const latestBook = booksWithYear[booksWithYear.length - 1] ?? null

    const booksWithPages = books.filter((b) => b.pages !== null)
    const averagePages =
      booksWithPages.length > 0
        ? Math.round(
            booksWithPages.reduce((sum, b) => sum + (b.pages ?? 0), 0) /
              booksWithPages.length
          )
        : 0

    const genres = [
      ...new Set(books.map((b) => b.genre).filter((g): g is string => !!g)),
    ]

    const longestBook =
      booksWithPages.length > 0
        ? booksWithPages.reduce((max, b) =>
            (b.pages ?? 0) > (max.pages ?? 0) ? b : max
          )
        : null

    const shortestBook =
      booksWithPages.length > 0
        ? booksWithPages.reduce((min, b) =>
            (b.pages ?? 0) < (min.pages ?? 0) ? b : min
          )
        : null

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks,
      firstBook: firstBook
        ? { title: firstBook.title, year: firstBook.publishedYear }
        : null,
      latestBook: latestBook
        ? { title: latestBook.title, year: latestBook.publishedYear }
        : null,
      averagePages,
      genres,
      longestBook: longestBook
        ? { title: longestBook.title, pages: longestBook.pages }
        : null,
      shortestBook: shortestBook
        ? { title: shortestBook.title, pages: shortestBook.pages }
        : null,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del autor' },
      { status: 500 }
    )
  }
}
