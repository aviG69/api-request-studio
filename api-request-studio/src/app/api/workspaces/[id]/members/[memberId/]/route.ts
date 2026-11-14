import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
})

export async function PATCH(
  _req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, memberId } = await context.params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { members: true },
  })

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const requesterMembership = workspace.members.find((m) => m.userId === session.user!.id)
  if (!requesterMembership || requesterMembership.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin required' }, { status: 403 })
  }

  const targetMember = workspace.members.find((m) => m.id === memberId)
  if (!targetMember) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  if (targetMember.userId === session.user.id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
  }

  try {
    const body = await _req.json()
    const { role } = updateMemberSchema.parse(body)

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
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

  const { id, memberId } = await context.params

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { members: true },
  })

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const requesterMembership = workspace.members.find((m) => m.userId === session.user!.id)
  if (!requesterMembership || requesterMembership.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin required' }, { status: 403 })
  }

  const targetMember = workspace.members.find((m) => m.id === memberId)
  if (!targetMember) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  if (targetMember.userId === session.user.id) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } })

  return NextResponse.json({ success: true })
}