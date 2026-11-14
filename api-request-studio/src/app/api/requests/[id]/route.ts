import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(5000).optional().nullable(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).optional(),
  url: z.string().url().optional(),
  headers: z.array(z.object({ key: z.string(), value: z.string(), enabled: z.boolean().default(true) })).optional(),
  queryParams: z.array(z.object({ key: z.string(), value: z.string(), enabled: z.boolean().default(true) })).optional(),
  body: z.any().optional(),
  bodyType: z.enum(['NONE', 'JSON', 'FORM_DATA', 'URLENCODED', 'RAW', 'BINARY', 'GRAPHQL']).optional(),
  auth: z.any().optional(),
  settings: z.any().optional(),
  order: z.number().int().optional(),
})

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      collection: { include: { workspace: { include: { members: true } } } },
    },
  })

  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const isMember = request.collection.workspace.members.some((m) => m.userId === session.user!.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(request)
}

export async function PATCH(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const request = await prisma.request.findUnique({
    where: { id },
    include: { collection: { include: { workspace: { include: { members: true } } } } },
  })

  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const membership = request.collection.workspace.members.find((m) => m.userId === session.user!.id)
  if (!membership || membership.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await _req.json()
    const data = updateRequestSchema.parse(body)

    const updated = await prisma.request.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const request = await prisma.request.findUnique({
    where: { id },
    include: { collection: { include: { workspace: { include: { members: true } } } } },
  })

  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const membership = request.collection.workspace.members.find((m) => m.userId === session.user!.id)
  if (!membership || (membership.role !== 'ADMIN' && request.collection.ownerId !== session.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.request.delete({ where: { id } })

  return NextResponse.json({ success: true })
}