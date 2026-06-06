import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const authors = [
  {
    name: 'Gabriel García Márquez',
    email: 'gabo@example.com',
    nationality: 'Colombia',
    birthYear: 1927,
    bio: 'Premio Nobel de Literatura 1982, maestro del realismo mágico.',
  },
  {
    name: 'Mario Vargas Llosa',
    email: 'mvargas@example.com',
    nationality: 'Perú',
    birthYear: 1936,
    bio: 'Premio Nobel de Literatura 2010, novelista y ensayista peruano.',
  },
  {
    name: 'Isabel Allende',
    email: 'iallende@example.com',
    nationality: 'Chile',
    birthYear: 1942,
    bio: 'Escritora chilena, autora de La casa de los espíritus.',
  },
  {
    name: 'Jorge Luis Borges',
    email: 'jborges@example.com',
    nationality: 'Argentina',
    birthYear: 1899,
    bio: 'Poeta, ensayista y cuentista argentino, referente de la literatura universal.',
  },
]

const booksByAuthorEmail: Record<
  string,
  {
    title: string
    description: string
    isbn: string
    publishedYear: number
    genre: string
    pages: number
  }[]
> = {
  'gabo@example.com': [
    {
      title: 'Cien años de soledad',
      description: 'Obra maestra del realismo mágico.',
      isbn: '978-0307474728',
      publishedYear: 1967,
      genre: 'Novela',
      pages: 417,
    },
    {
      title: 'El amor en los tiempos del cólera',
      description: 'Historia de amor que atraviesa décadas.',
      isbn: '978-0307389732',
      publishedYear: 1985,
      genre: 'Novela',
      pages: 348,
    },
  ],
  'mvargas@example.com': [
    {
      title: 'La ciudad y los perros',
      description: 'Novela sobre la vida en un colegio militar limeño.',
      isbn: '978-8466333850',
      publishedYear: 1963,
      genre: 'Novela',
      pages: 408,
    },
    {
      title: 'La fiesta del Chivo',
      description: 'Novela sobre la dictadura de Trujillo en República Dominicana.',
      isbn: '978-8466329723',
      publishedYear: 2000,
      genre: 'Novela',
      pages: 535,
    },
  ],
  'iallende@example.com': [
    {
      title: 'La casa de los espíritus',
      description: 'Saga familiar en un contexto político latinoamericano.',
      isbn: '978-0060092663',
      publishedYear: 1982,
      genre: 'Novela',
      pages: 433,
    },
  ],
  'jborges@example.com': [
    {
      title: 'Ficciones',
      description: 'Colección de cuentos que exploran laberintos y bibliotecas infinitas.',
      isbn: '978-0802130305',
      publishedYear: 1944,
      genre: 'Cuento',
      pages: 174,
    },
  ],
}

async function main() {
  console.log('Sembrando base de datos...')

  await prisma.book.deleteMany()
  await prisma.author.deleteMany()

  for (const authorData of authors) {
    const author = await prisma.author.create({ data: authorData })
    const books = booksByAuthorEmail[authorData.email] ?? []

    for (const book of books) {
      await prisma.book.create({
        data: { ...book, authorId: author.id },
      })
    }

    console.log(`✓ ${author.name} (${books.length} libros)`)
  }

  const totalAuthors = await prisma.author.count()
  const totalBooks = await prisma.book.count()

  console.log(`\nListo: ${totalAuthors} autores y ${totalBooks} libros (${totalAuthors + totalBooks} registros)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
