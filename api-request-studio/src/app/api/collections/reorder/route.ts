import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().cuid(),
    order: z.number().int(),
    parentId: z.string().cuid().optional().nullable(),
  })),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { items } = reorderSchema.parse(body)

    if (items.length === 0) {
      return NextResponse.json({ success: true })
    }

    const firstItem = await prisma.collection.findUnique({
      where: { id: items[0].id },
      include: { workspace: { include: { members: true } } },
    })

    if (!firstItem) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const isMember = firstItem.workspace.members.some((m) => m.userId === session.user!.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.collection.update({
          where: { id: item.id },
          data: { order: item.order, parentId: item.parentId ?? null },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to reorder collections' }, { status: 500 })
  }
}