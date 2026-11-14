import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const resendInvitationSchema = z.object({
  email: z.string().email(),
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

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { members: true },
  })

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const membership = workspace.members.find((m) => m.userId === session.user!.id)
  if (!membership || membership.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const invitations = await prisma.invitation.findMany({
    where: { workspaceId: id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(invitations)
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

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { members: true },
  })

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const membership = workspace.members.find((m) => m.userId === session.user!.id)
  if (!membership || membership.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { email } = resendInvitationSchema.parse(body)

    const existingInvitation = await prisma.invitation.findFirst({
      where: { workspaceId: id, email, expiresAt: { gt: new Date() } },
    })

    if (existingInvitation) {
      return NextResponse.json({ error: 'Active invitation already exists' }, { status: 400 })
    }

    const invitedUser = await prisma.user.findUnique({ where: { email } })
    if (invitedUser) {
      const existingMember = workspace.members.find((m) => m.userId === invitedUser.id)
      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
      }
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const invitation = await prisma.invitation.create({
      data: {
        email,
        workspaceId: id,
        role: 'EDITOR',
        token,
        expiresAt,
      },
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const invitationId = searchParams.get('invitationId')

  if (!invitationId) {
    return NextResponse.json({ error: 'invitationId required' }, { status: 400 })
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { members: true },
  })

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const membership = workspace.members.find((m) => m.userId === session.user!.id)
  if (!membership || membership.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.invitation.delete({ where: { id: invitationId } })

  return NextResponse.json({ success: true })
}