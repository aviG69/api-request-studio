import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      _count: { select: { collections: true, environments: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(workspaces)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description } = createWorkspaceSchema.parse(body)

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50)

    const existingSlug = await prisma.workspace.findUnique({ where: { slug } })
    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug: finalSlug,
        description,
        ownerId: session.user.id!,
        members: {
          create: { userId: session.user.id!, role: 'ADMIN' },
        },
      },
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }
}