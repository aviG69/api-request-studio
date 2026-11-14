import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateVariableSchema = z.object({
  key: z.string().min(1).max(100).optional(),
  value: z.string().max(5000).optional(),
  type: z.enum(['DEFAULT', 'SECRET']).optional(),
  description: z.string().max(500).optional().nullable(),
})

export async function PATCH(
  _req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, variableId } = await context.params

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

  const variable = await prisma.collectionVariable.findUnique({
    where: { id: variableId },
  })

  if (!variable || variable.collectionId !== id) {
    return NextResponse.json({ error: 'Variable not found' }, { status: 404 })
  }

  try {
    const body = await _req.json()
    const data = updateVariableSchema.parse(body)

    if (data.key && data.key !== variable.key) {
      const existing = await prisma.collectionVariable.findUnique({
        where: { collectionId_key: { collectionId: id, key: data.key } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Variable with this key already exists' }, { status: 400 })
      }
    }

    const updated = await prisma.collectionVariable.update({
      where: { id: variableId },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update variable' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, variableId } = await context.params

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

  const variable = await prisma.collectionVariable.findUnique({
    where: { id: variableId },
  })

  if (!variable || variable.collectionId !== id) {
    return NextResponse.json({ error: 'Variable not found' }, { status: 404 })
  }

  await prisma.collectionVariable.delete({ where: { id: variableId } })

  return NextResponse.json({ success: true })
}