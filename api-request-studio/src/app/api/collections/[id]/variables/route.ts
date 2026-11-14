import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createVariableSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(5000),
  type: z.enum(['DEFAULT', 'SECRET']).default('DEFAULT'),
  description: z.string().max(500).optional().nullable(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: { workspace: { include: { members: true } } },
  })

  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const isMember = collection.workspace.members.some((m) => m.userId === session.user!.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const variables = await prisma.collectionVariable.findMany({
    where: { collectionId: id },
    orderBy: { key: 'asc' },
  })

  return NextResponse.json(variables)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: { workspace: { include: { members: true } } },
  })

  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const membership = collection.workspace.members.find((m) => m.userId === session.user!.id)
  if (!membership || membership.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { key, value, type, description } = createVariableSchema.parse(body)

    const existing = await prisma.collectionVariable.findUnique({
      where: { collectionId_key: { collectionId: id, key } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Variable with this key already exists' }, { status: 400 })
    }

    const variable = await prisma.collectionVariable.create({
      data: { collectionId: id, key, value, type, description },
    })

    return NextResponse.json(variable, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create variable' }, { status: 500 })
  }
}