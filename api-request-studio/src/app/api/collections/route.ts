import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(5000).optional().nullable(),
  workspaceId: z.string().cuid(),
  parentId: z.string().cuid().optional().nullable(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get('workspaceId')

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: true },
  })

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const isMember = workspace.members.some((m) => m.userId === session.user!.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const collections = await prisma.collection.findMany({
    where: { workspaceId },
    include: {
      requests: { orderBy: { order: 'asc' } },
      children: { orderBy: { order: 'asc' } },
      variables: true,
    },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(collections)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, workspaceId, parentId } = createCollectionSchema.parse(body)

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const isMember = workspace.members.some((m) => m.userId === session.user!.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const maxOrder = await prisma.collection.aggregate({
      where: { workspaceId, parentId: parentId || null },
      _max: { order: true },
    })

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        workspaceId,
        parentId,
        ownerId: session.user!.id!,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }
}