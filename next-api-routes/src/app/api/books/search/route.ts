import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

const SORT_FIELDS = ['title', 'publishedYear', 'createdAt'] as const

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const genre = searchParams.get('genre') || undefined
    const authorName = searchParams.get('authorName') || undefined

    let page = parseInt(searchParams.get('page') || '1', 10)
    let limit = parseInt(searchParams.get('limit') || '10', 10)
    const sortByParam = searchParams.get('sortBy') || 'createdAt'
    const orderParam = searchParams.get('order') || 'desc'

    if (Number.isNaN(page) || page < 1) page = 1
    if (Number.isNaN(limit) || limit < 1) limit = 10
    if (limit > 50) limit = 50

    const sortBy = SORT_FIELDS.includes(
      sortByParam as (typeof SORT_FIELDS)[number]
    )
      ? (sortByParam as (typeof SORT_FIELDS)[number])
      : 'createdAt'
    const order = orderParam === 'asc' ? 'asc' : 'desc'

    const where: Prisma.BookWhereInput = {
      AND: [
        search
          ? { title: { contains: search, mode: 'insensitive' } }
          : {},
        genre ? { genre } : {},
        authorName
          ? {
              author: {
                name: { contains: authorName, mode: 'insensitive' },
              },
            }
          : {},
      ],
    }

    const [total, data] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error en la búsqueda de libros' },
      { status: 500 }
    )
  }
}
