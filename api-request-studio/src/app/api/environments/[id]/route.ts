import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateEnvironmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
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

  const environment = await prisma.environment.findUnique({
    where: { id },
    include: { workspace: { include: { members: true } }, variables: true },
  })

  if (!environment) {
    return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
  }

  const isMember = environment.workspace.members.some((m) => m.userId === session.user!.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(environment)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const environment = await prisma.environment.findUnique({
    where: { id },
    include: { workspace: { include: { members: true } } },
  })

  if (!environment) {
    return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
  }

  const membership = environment.workspace.members.find((m) => m.userId === session.user!.id)
  if (!membership || membership.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = updateEnvironmentSchema.parse(body)

    // If setting as active, deactivate other environments in workspace
    if (data.isActive) {
      await prisma.environment.updateMany({
        where: { workspaceId: environment.workspaceId, isActive: true },
        data: { isActive: false },
      })
    }

    const updated = await prisma.environment.update({
      where: { id },
      data,
      include: { variables: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update environment' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const environment = await prisma.environment.findUnique({
    where: { id },
    include: { workspace: { include: { members: true } } },
  })

  if (!environment) {
    return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
  }

  const membership = environment.workspace.members.find((m) => m.userId === session.user!.id)
  if (!membership || (membership.role !== 'ADMIN' && environment.workspace.ownerId !== session.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.environment.delete({ where: { id } })

  return NextResponse.json({ success: true })
}