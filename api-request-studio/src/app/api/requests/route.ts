import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(5000).optional().nullable(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  url: z.string().url(),
  headers: z.array(z.object({ key: z.string(), value: z.string(), enabled: z.boolean().default(true) })).default([]),
  queryParams: z.array(z.object({ key: z.string(), value: z.string(), enabled: z.boolean().default(true) })).default([]),
  body: z.any().optional(),
  bodyType: z.enum(['NONE', 'JSON', 'FORM_DATA', 'URLENCODED', 'RAW', 'BINARY', 'GRAPHQL']).default('NONE'),
  auth: z.any().optional(),
  settings: z.any().optional(),
  collectionId: z.string().cuid(),
})

export async function GET(_req: Request, _context: { params: Promise<{}> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(_req.url)
  const collectionId = searchParams.get('collectionId')

  if (!collectionId) {
    return NextResponse.json({ error: 'collectionId required' }, { status: 400 })
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: { workspace: { include: { members: true } } },
  })

  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const isMember = collection.workspace.members.some((m) => m.userId === session.user!.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const requests = await prisma.request.findMany({
    where: { collectionId },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(requests)
}

export async function POST(_req: Request, _context: { params: Promise<{}> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await _req.json()
    const data = createRequestSchema.parse(body)

    const collection = await prisma.collection.findUnique({
      where: { id: data.collectionId },
      include: { workspace: { include: { members: true } } },
    })

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const isMember = collection.workspace.members.some((m) => m.userId === session.user!.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const maxOrder = await prisma.request.aggregate({
      where: { collectionId: data.collectionId },
      _max: { order: true },
    })

    const request = await prisma.request.create({
      data: {
        ...data,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    })

    return NextResponse.json(request, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }
}