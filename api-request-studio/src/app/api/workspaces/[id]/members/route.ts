import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).default('EDITOR'),
})

const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
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
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
    },
  })

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const isMember = workspace.members.some((m) => m.userId === session.user!.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(workspace.members)
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
    const { email, role } = inviteMemberSchema.parse(body)

    const invitedUser = await prisma.user.findUnique({ where: { email } })

    if (invitedUser) {
      const existingMember = workspace.members.find((m) => m.userId === invitedUser.id)
      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
      }

      const member = await prisma.workspaceMember.create({
        data: {
          userId: invitedUser.id,
          workspaceId: id,
          role,
        },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      })

      return NextResponse.json(member, { status: 201 })
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const invitation = await prisma.invitation.create({
      data: {
        email,
        workspaceId: id,
        role,
        token,
        expiresAt,
      },
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 })
  }
}